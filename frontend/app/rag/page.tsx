"use client";
import { useState, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import FallbackBadge from "@/components/FallbackBadge";
import { ragUpload, ragQuery } from "@/lib/api";

interface Msg { role: "user" | "ai"; text: string; ts: string; }

const ALLOWED = ["pdf", "png", "jpg", "jpeg", "tiff", "tif", "bmp", "docx", "txt"];
const SUGGESTIONS = [
  "What does my diagnosis mean?",
  "Explain the medications listed",
  "What are my risk factors?",
  "What should I expect next?",
  "Summarise this report briefly",
];

const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => {
        if (line.startsWith("• "))
          return <div key={i} style={{ display: "flex", gap: 8, marginTop: 4 }}><span style={{ color: "var(--cyan)" }}>•</span><span>{line.slice(2)}</span></div>;
        if (line.includes("**")) {
          const parts = line.split("**");
          return <div key={i} style={{ marginTop: i > 0 ? 4 : 0 }}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: "var(--text-1)" }}>{p}</strong> : p)}</div>;
        }
        return line ? <div key={i} style={{ marginTop: i > 0 ? 4 : 0 }}>{line}</div> : <div key={i} style={{ height: 8 }} />;
      })}
    </>
  );
}

export default function RagPage() {
  const [fileName, setFileName]     = useState<string | null>(null);
  const [sessionId, setSessionId]   = useState<string | null>(null);
  const [ready, setReady]           = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [fallback, setFallback]     = useState(false);
  const [chunksIndexed, setChunks]  = useState(0);

  const [msgs, setMsgs]     = useState<Msg[]>([]);
  const [input, setInput]   = useState("");
  const [sending, setSending] = useState(false);
  const [drag, setDrag]     = useState(false);

  const fileRef  = useRef<HTMLInputElement>(null);
  const endRef   = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const handleFile = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.includes(ext)) { alert(`Unsupported type .${ext}`); return; }

    setFileName(f.name); setUploading(true); setReady(false);
    setSessionId(null); setMsgs([]); setFallback(false); setChunks(0);

    const r = await ragUpload(f);
    setSessionId(r.session_id);
    setChunks(r.chunks_indexed);
    setFallback(r.fromFallback ?? false);
    setReady(true); setUploading(false);

    const intro = r.fromFallback
      ? `I've loaded a demo context (backend offline). Ask me anything — I'll respond with sample answers.`
      : `I've indexed **"${f.name}"** (${r.chunks_indexed} section${r.chunks_indexed !== 1 ? "s" : ""} indexed). Ask me anything about its contents.`;

    setMsgs([{ role: "ai", text: intro, ts: ts() }]);
  };

  const send = async (txt?: string) => {
    const q = (txt ?? input).trim();
    if (!q || sending || !ready || !sessionId) return;

    setMsgs(p => [...p, { role: "user", text: q, ts: ts() }]);
    setInput(""); setSending(true);

    const r = await ragQuery(sessionId, q);
    setMsgs(p => [...p, { role: "ai", text: r.answer, ts: ts() }]);
    setSending(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 1100, width: "100%", margin: "0 auto", padding: "40px 24px 28px", display: "flex", flexDirection: "column", gap: 22 }}>

        {/* Header */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(99,102,241,.1)", border: "1px solid rgba(99,102,241,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="2" width="11" height="15" rx="2" stroke="#6366f1" strokeWidth="1.4"/>
                <path d="M6 7h5M6 11h5M6 15h3" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="17" cy="17" r="4" fill="rgba(99,102,241,.15)" stroke="#6366f1" strokeWidth="1.4"/>
                <path d="M15.5 17h3M17 15.5v3" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 9, color: "var(--violet)", letterSpacing: ".1em", marginBottom: 2 }}>MODULE · RAG-LLM</div>
              <h1 className="font-syne" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.5px" }}>Report Intelligence</h1>
            </div>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 580, lineHeight: 1.75 }}>
            Upload your diagnosis report and chat with it. Powered by Gemini + FAISS RAG — answers grounded only in your document.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18, flex: 1, minHeight: 520 }}>

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Upload */}
            <div className="card" style={{ padding: 18 }}>
              <div className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: ".1em", marginBottom: 12 }}>UPLOAD DOCUMENT</div>

              <div
                className={`upload-zone ${drag ? "drag" : ""}`}
                style={{ minHeight: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 18, textAlign: "center", position: "relative", overflow: "hidden", cursor: "pointer" }}
                onDragOver={e => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onClick={() => fileRef.current?.click()}
              >
                {drag && <div className="scan-line" style={{ background: "linear-gradient(90deg,transparent,var(--violet),transparent)" }} />}
                {fileName ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginBottom: 6 }}>
                      <rect x="3" y="2" width="12" height="17" rx="2" stroke="#6366f1" strokeWidth="1.3" fill="rgba(99,102,241,.1)"/>
                      <path d="M7 7h5M7 11h5M7 15h3" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    <div className="font-mono" style={{ fontSize: 10, color: "var(--violet)", wordBreak: "break-all" }}>{fileName}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>tap to replace</div>
                  </>
                ) : (
                  <>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ marginBottom: 7, opacity: .4 }}>
                      <rect x="4" y="4" width="14" height="18" rx="2" stroke="#6366f1" strokeWidth="1.3" strokeDasharray="3 2"/>
                      <path d="M14 10v8M11 13l3-3 3 3" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div style={{ fontSize: 12, color: "var(--text-2)" }}>Drop report here</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>PDF · DOCX · TXT · PNG · JPG</div>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.tiff,.docx,.txt" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {uploading && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7 }}>
                  <div className="spinner" style={{ borderColor: "rgba(99,102,241,.25)", borderTopColor: "var(--violet)" }} />
                  <span style={{ fontSize: 12, color: "var(--violet)" }}>Indexing…</span>
                </div>
              )}

              {ready && !uploading && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", background: "rgba(0,180,160,.07)", border: "1px solid rgba(0,180,160,.18)", borderRadius: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--teal)" }}>
                    {chunksIndexed > 0 ? `${chunksIndexed} sections indexed` : "Ready"}
                  </span>
                </div>
              )}

              {fallback && ready && (
                <div style={{ marginTop: 8 }}><FallbackBadge /></div>
              )}
            </div>

            {/* Suggestions */}
            {ready && (
              <div className="card" style={{ padding: 18 }}>
                <div className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: ".1em", marginBottom: 10 }}>TRY ASKING</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {SUGGESTIONS.map(q => (
                    <button
                      key={q}
                      disabled={sending}
                      onClick={() => send(q)}
                      style={{ textAlign: "left", padding: "7px 10px", background: "rgba(99,102,241,.05)", border: "1px solid rgba(99,102,241,.1)", borderRadius: 7, cursor: "pointer", fontSize: 12, color: "var(--text-2)", transition: "all .18s", opacity: sending ? .45 : 1 }}
                      onMouseEnter={e => { (e.currentTarget.style.background = "rgba(99,102,241,.1)"); (e.currentTarget.style.color = "var(--text-1)"); }}
                      onMouseLeave={e => { (e.currentTarget.style.background = "rgba(99,102,241,.05)"); (e.currentTarget.style.color = "var(--text-2)"); }}
                    >{q}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Info box */}
            <div style={{ padding: 14, background: "rgba(99,102,241,.04)", border: "1px solid rgba(99,102,241,.1)", borderRadius: 11 }}>
              <div style={{ fontSize: 10, color: "var(--violet)", fontWeight: 600, marginBottom: 5 }}>HOW IT WORKS</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.8 }}>
                1. Upload your report<br/>
                2. Gemini indexes it via RAG<br/>
                3. Ask in plain language<br/>
                4. Answers grounded in your doc
              </div>
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* Chat header */}
            <div style={{ padding: "13px 20px", borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg,rgba(99,102,241,.2),rgba(0,212,255,.1))", border: "1px solid rgba(99,102,241,.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4" stroke="#6366f1" strokeWidth="1.1"/><path d="M4 6h4M6 4v4" stroke="#6366f1" strokeWidth="1.1" strokeLinecap="round"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>IntelliMed RAG Assistant</div>
                <div className="font-mono" style={{ fontSize: 9, color: ready ? "var(--teal)" : "var(--text-3)" }}>
                  {ready
                    ? `● CONTEXT LOADED${sessionId?.startsWith("demo-") ? " (DEMO)" : ""}`
                    : "○ AWAITING DOCUMENT"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14, minHeight: 0 }}>

              {msgs.length === 0 && !uploading && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: .3, textAlign: "center" }}>
                  <svg width="42" height="42" viewBox="0 0 42 42" fill="none" style={{ marginBottom: 10 }}>
                    <rect x="6" y="6" width="18" height="24" rx="3" stroke="#6366f1" strokeWidth="1.4" strokeDasharray="4 3"/>
                    <path d="M12 16h8M12 21h8M12 26h5" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
                    <circle cx="32" cy="32" r="7" stroke="#6366f1" strokeWidth="1.4" fill="rgba(99,102,241,.1)"/>
                    <path d="M29.5 32h5M32 29.5v5" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                  <div style={{ fontSize: 14, color: "var(--text-2)" }}>Upload a report to start</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>PDF, images, or documents</div>
                </div>
              )}

              {msgs.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 9, alignItems: "flex-end" }}>
                  {m.role === "ai" && (
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.28)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3.5" stroke="#6366f1" strokeWidth="1"/><path d="M3 5h4M5 3v4" stroke="#6366f1" strokeWidth="1" strokeLinecap="round"/></svg>
                    </div>
                  )}
                  <div style={{ maxWidth: "76%" }}>
                    <div
                      className={m.role === "user" ? "bubble-user" : "bubble-ai"}
                      style={{ padding: "10px 14px", fontSize: 13.5, lineHeight: 1.72, color: "var(--text-2)" }}
                    >
                      <RichText text={m.text} />
                    </div>
                    <div className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3, textAlign: m.role === "user" ? "right" : "left" }}>{m.ts}</div>
                  </div>
                </div>
              ))}

              {sending && (
                <div style={{ display: "flex", gap: 9, alignItems: "flex-end" }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(99,102,241,.15)", border: "1px solid rgba(99,102,241,.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className="spinner" style={{ width: 11, height: 11, borderColor: "rgba(99,102,241,.25)", borderTopColor: "var(--violet)" }} />
                  </div>
                  <div className="bubble-ai" style={{ padding: "12px 15px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[0, 1, 2].map(d => <div key={d} className="dot" style={{ background: "var(--violet)", animationDelay: `${d * 0.18}s` }} />)}
                    </div>
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ display: "flex", gap: 9 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={ready ? "Ask anything about your report…" : "Upload a document first…"}
                  disabled={!ready || sending}
                  style={{ flex: 1, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 10, padding: "10px 14px", color: "var(--text-1)", fontSize: 14, outline: "none", fontFamily: "DM Sans, sans-serif", transition: "border-color .2s" }}
                  onFocus={e => (e.target.style.borderColor = "rgba(99,102,241,.38)")}
                  onBlur={e =>  (e.target.style.borderColor = "rgba(255,255,255,.07)")}
                />
                <button
                  onClick={() => send()}
                  disabled={!ready || sending || !input.trim()}
                  style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: ready && input.trim() ? "linear-gradient(135deg,rgba(99,102,241,.22),rgba(99,102,241,.14))" : "rgba(255,255,255,.03)", border: `1px solid ${ready && input.trim() ? "rgba(99,102,241,.38)" : "rgba(255,255,255,.05)"}`, cursor: ready && input.trim() ? "pointer" : "not-allowed", transition: "all .2s" }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7L12 2l-4 10-2-4-4-1z" stroke={ready && input.trim() ? "var(--violet)" : "var(--text-3)"} strokeWidth="1.2" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-3)", textAlign: "center" }}>
                AI responses are informational only — consult a qualified medical professional.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
