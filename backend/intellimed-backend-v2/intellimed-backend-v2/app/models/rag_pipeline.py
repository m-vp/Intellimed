"""
IntelliMed RAG Pipeline

Flow:
    upload(text, filename)
        1. Split text into overlapping chunks
        2. Embed chunks using Gemini text-embedding-004
        3. Store vectors in the configured vector store (FAISS or ChromaDB)
        4. Return a session_id the frontend will send with every query

    query(session_id, question)
        1. Embed the question
        2. Retrieve the top-k most similar chunks from the vector store
        3. Build a prompt with those chunks as context
        4. Call Gemini to generate a grounded answer
        5. Return { answer }

Vector store is decoupled via RAG_STORE env var:
    RAG_STORE=memory  → FAISS in-memory (default)
                         Fast, zero config, data lost on restart.
                         Good for local dev and demo.

    RAG_STORE=chroma  → ChromaDB persisted to CHROMA_PATH on disk
                         Survives restarts, easy to move to another machine:
                         just copy the CHROMA_PATH folder.
                         Good for when you move to a server.
"""

import os
import uuid
import logging
import textwrap
from typing import Optional

logger = logging.getLogger(__name__)

# In-memory session registry
# Maps session_id → { "store_ref": ..., "filename": str, "chunks": int }
_sessions: dict = {}

# ── Config ────────────────────────────────────────────────────────────────────
CHUNK_SIZE    = 800
CHUNK_OVERLAP = 150
TOP_K         = 5


# ── Gemini client (lazy init) ─────────────────────────────────────────────────
_gemini_client = None

def _get_gemini():
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise EnvironmentError(
                "GEMINI_API_KEY is not set. "
                "Add it to your .env file."
            )
        _gemini_client = genai.Client(api_key=api_key)
    return _gemini_client


# ── Embedding ─────────────────────────────────────────────────────────────────

# def _embed(texts: list[str]) -> list[list[float]]:
#     """Embed a list of texts using Gemini text-embedding-004."""
#     client = _get_gemini()
#     result = client.models.embed_content(
#         model="text-embedding-004",
#         contents = texts,
#     )
#     # result.embeddings is a list of ContentEmbedding objects
#     return [e.values for e in result.embeddings]

def _embed(texts: list[str]) -> list[list[float]]:
    client = _get_gemini()
    embed_model = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-001")
    result = client.models.embed_content(
        model=embed_model,
        contents=texts,
    )
    return [e.values for e in result.embeddings]


# ── Vector store (decoupled) ──────────────────────────────────────────────────

def _build_store(chunks: list[str], session_id: str):
    """
    Embed chunks and store them in the configured vector store.
    Returns an opaque store_ref that _retrieve() knows how to use.
    """
    store_type = os.getenv("RAG_STORE", "memory").lower()
    vectors    = _embed(chunks)

    if store_type == "chroma":
        return _build_chroma(chunks, vectors, session_id)
    elif store_type == "azure_chroma":                          # ← ADD THIS
        return _build_chroma_azure(chunks, vectors, session_id)
    else:
        return _build_faiss(chunks, vectors)


def _retrieve(store_ref, question: str) -> list[str]:
    """Return top-k relevant chunk texts for a question."""
    store_type = os.getenv("RAG_STORE", "memory").lower()
    q_vec      = _embed([question])[0]

    if store_type == "chroma":
        return _query_chroma(store_ref, q_vec, question)
    elif store_type == "azure_chroma":                          # ← ADD THIS
        return _query_chroma(store_ref, q_vec, question)
    else:
        return _query_faiss(store_ref, q_vec)


# ── FAISS (in-memory) ─────────────────────────────────────────────────────────

def _build_faiss(chunks: list[str], vectors: list[list[float]]):
    import faiss
    import numpy as np

    dim    = len(vectors[0])
    index  = faiss.IndexFlatL2(dim)
    matrix = np.array(vectors, dtype=np.float32)
    index.add(matrix)

    return {"type": "faiss", "index": index, "chunks": chunks}


def _query_faiss(store_ref: dict, q_vec: list[float]) -> list[str]:
    import faiss
    import numpy as np

    index  = store_ref["index"]
    chunks = store_ref["chunks"]
    k      = min(TOP_K, len(chunks))

    query  = np.array([q_vec], dtype=np.float32)
    _, ids = index.search(query, k)

    return [chunks[i] for i in ids[0] if i < len(chunks)]


# ── ChromaDB (persisted) ──────────────────────────────────────────────────────

def _build_chroma(chunks: list[str], vectors: list[list[float]], session_id: str):
    try:
        import chromadb
    except ImportError:
        raise ImportError("chromadb not installed. Run: pip install chromadb")

    path   = os.getenv("CHROMA_PATH", "./chroma_db")
    client = chromadb.PersistentClient(path=path)

    # Each session gets its own collection
    col_name   = f"session_{session_id.replace('-', '_')}"
    collection = client.get_or_create_collection(col_name)

    collection.add(
        ids        = [str(i) for i in range(len(chunks))],
        documents  = chunks,
        embeddings = vectors,
    )

    return {"type": "chroma", "collection": collection}


def _query_chroma(store_ref: dict, q_vec: list[float], question: str) -> list[str]:
    col = store_ref["collection"]
    res = col.query(
        query_embeddings = [q_vec],
        n_results        = TOP_K,
    )
    return res["documents"][0]


#=============Azure===================
def _build_chroma_azure(chunks: list[str], vectors: list[list[float]], session_id: str) -> dict:
    import chromadb

    host  = os.getenv("CHROMA_AZURE_HOST", "").rstrip("/")
    token = os.getenv("CHROMA_AZURE_TOKEN", "")

    client = chromadb.HttpClient(
        host    = host,
        port    = 443,
        ssl     = True,
        headers = {"Authorization": f"Bearer {token}"} if token else {},
    )
    client.heartbeat()  # fails fast if URL is wrong

    col = client.get_or_create_collection(
        name     = f"session_{session_id.replace('-', '_')}",
        metadata = {"hnsw:space": "cosine"},
    )
    col.add(
        ids        = [str(i) for i in range(len(chunks))],
        documents  = chunks,
        embeddings = vectors,
    )
    return {"type": "chroma", "collection": col}

#=====================================================================

# ── Text splitting ────────────────────────────────────────────────────────────

def _split_text(text: str) -> list[str]:
    """
    Simple recursive splitter — tries paragraph breaks first,
    then line breaks, then sentences, then words.
    """
    if len(text) <= CHUNK_SIZE:
        return [text.strip()] if text.strip() else []

    chunks = []
    separators = ["\n\n", "\n", ". ", " "]

    def _split(block: str, sep_idx: int):
        if len(block) <= CHUNK_SIZE or sep_idx >= len(separators):
            if block.strip():
                chunks.append(block.strip())
            return

        sep   = separators[sep_idx]
        parts = block.split(sep)
        buf   = ""

        for part in parts:
            candidate = buf + sep + part if buf else part
            if len(candidate) <= CHUNK_SIZE:
                buf = candidate
            else:
                if buf.strip():
                    chunks.append(buf.strip())
                buf = part

        if buf.strip():
            chunks.append(buf.strip())

    _split(text, 0)

    # Add overlap: each chunk also gets the last sentence of the previous chunk
    if len(chunks) > 1:
        overlapped = [chunks[0]]
        for i in range(1, len(chunks)):
            tail    = chunks[i - 1][-CHUNK_OVERLAP:].strip()
            overlapped.append(tail + " " + chunks[i])
        return overlapped

    return chunks


# ── Prompt ────────────────────────────────────────────────────────────────────

# _PROMPT = textwrap.dedent("""
#     You are IntelliMed, a compassionate medical AI assistant that helps patients
#     understand their diagnosis reports.

#     Rules:
#     1. Answer ONLY using information from the context below.
#     2. If the answer isn't in the context, say so clearly — never invent medical facts.
#     3. Use plain, empathetic language. Explain any medical term you use.
#     4. Keep answers clear and concise (2-5 sentences for simple questions).
#     5. Always recommend consulting a qualified doctor for treatment decisions.

#     Context from the patient's report:
#     {context}

#     Patient's question: {question}

#     Answer:
# """).strip()

_PROMPT = textwrap.dedent("""
    You are IntelliMed, a compassionate medical AI assistant that helps patients
    understand their diagnosis reports.

    Rules:
    1. Answer ONLY using information from the context below.
    2. If the answer isn't in the context, say so clearly — never invent medical facts.
    3. Use plain, empathetic language. Explain any medical term you use.
    4. Keep answers clear and concise (2-5 sentences for simple questions).
    5. Always recommend consulting a qualified doctor for treatment decisions.
    6. If the question is not related to the patient's medical report or health/diagnosis
       in general, respond with exactly:
       "I can only help with questions about your medical report and diagnosis.
        Please ask your doctor about anything else."
       Do not answer the question at all in that case.

    Context from the patient's report:
    {context}

    Patient's question: {question}

    Answer:
""").strip()


# ── Public API ────────────────────────────────────────────────────────────────

def upload(text: str, filename: str) -> dict:
    """
    Index a document and return a session_id.

    Returns:
        { "session_id": str, "chunks_indexed": int }
    """
    if not text or not text.strip():
        raise ValueError("Document appears to be empty or has no readable text.")

    chunks = _split_text(text)
    if not chunks:
        raise ValueError("Could not extract any content from the document.")

    logger.info(f"[RAG] Indexing '{filename}' → {len(chunks)} chunks")

    store_ref  = _build_store(chunks, session_id := str(uuid.uuid4()))
    _sessions[session_id] = {
        "store_ref": store_ref,
        "filename":  filename,
        "chunks":    len(chunks),
    }

    logger.info(f"[RAG] Session created: {session_id}  store={os.getenv('RAG_STORE','memory')}")
    return {
        "session_id":    session_id,
        "chunks_indexed": len(chunks),
    }


def query(session_id: str, question: str) -> dict:
    """
    Answer a question grounded in the indexed document.

    Returns:
        { "answer": str }

    Raises:
        KeyError  if session_id not found
    """
    if session_id not in _sessions:
        raise KeyError(
            f"Session '{session_id}' not found. "
            "Please re-upload your document."
        )

    session = _sessions[session_id]
    logger.info(f"[RAG] Query on session {session_id}: '{question[:80]}'")

    # Retrieve relevant chunks
    relevant = _retrieve(session["store_ref"], question)
    if not relevant:
        return {"answer": "I could not find relevant information in your document to answer that question."}

    context  = "\n\n---\n\n".join(relevant)
    prompt   = _PROMPT.format(context=context, question=question)

    # Call Gemini
    client   = _get_gemini()
    model    = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    response = client.models.generate_content(
        model    = model,
        contents = prompt,
    )

    answer = response.text.strip()
    logger.info(f"[RAG] Answer generated ({len(answer)} chars)")
    return {"answer": answer}
