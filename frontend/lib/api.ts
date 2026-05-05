/**
 * IntelliMed — API layer
 *
 * Exact contract matches the Flask backend (intellimed-backend-v2):
 *
 *   POST /api/alzheimer/predict   → { prediction, confidence, breakdown, is_dummy }
 *   POST /api/brain-tumor/predict → { detected, confidence, is_dummy }
 *   POST /api/rag/upload          → { session_id, chunks_indexed }
 *   POST /api/rag/query           → { answer }
 *
 * Strategy:
 *   1. Hit the real backend first (15s timeout)
 *   2. If it fails for ANY reason → fall back to local dummy data
 *   3. All results carry `fromFallback: boolean` so the UI can show a notice
 */

// const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://backend.internal:5000";
const API_BASE = "/backend";
// ─── fetch wrapper ────────────────────────────────────────────────────────────

async function tryBackend<T>(path: string, init: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      console.warn(`[IntelliMed] ${path} → HTTP ${res.status}, using fallback`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[IntelliMed] ${path} unreachable, using fallback`, err);
    return null;
  }
}

// ─── Types — exactly what the backend returns ─────────────────────────────────

export type AlzheimerLabel =
  | "MildDemented"
  | "ModerateDemented"
  | "NonDemented"
  | "VeryMildDemented";

// export interface AlzheimerResult {
//   prediction:  AlzheimerLabel;
//   confidence:  number;                           // 0–100
//   breakdown:   { label: string; score: number }[]; // 4 items
//   is_dummy:    boolean;
//   fromFallback?: boolean;
// }

export interface AlzheimerResult {
  prediction:   AlzheimerLabel;
  is_dummy:     boolean;
  fromFallback?: boolean;
}

export type TumorLabel = "glioma" | "meningioma" | "notumor" | "pituitary";

export interface TumorResult {
  prediction:   TumorLabel;
  is_dummy:     boolean;
  fromFallback?: boolean;
}

const TUMOR_FALLBACKS: TumorResult[] = [
  { prediction: "glioma",      is_dummy: true },
  { prediction: "meningioma",  is_dummy: true },
  { prediction: "notumor",     is_dummy: true },
  { prediction: "pituitary",   is_dummy: true },
];

export interface RagUploadResult {
  session_id:     string;
  chunks_indexed: number;
  fromFallback?:  boolean;
}

export interface RagQueryResult {
  answer:       string;
  fromFallback?: boolean;
}

// ─── Fallback data ────────────────────────────────────────────────────────────

// const ALZ_FALLBACKS: AlzheimerResult[] = [
//   {
//     prediction: "NonDemented", confidence: 94.2, is_dummy: true,
//     breakdown: [
//       { label: "MildDemented",     score: 2.1 },
//       { label: "ModerateDemented", score: 1.4 },
//       { label: "NonDemented",      score: 94.2 },
//       { label: "VeryMildDemented", score: 2.3 },
//     ],
//   },
//   {
//     prediction: "MildDemented", confidence: 81.7, is_dummy: true,
//     breakdown: [
//       { label: "MildDemented",     score: 81.7 },
//       { label: "ModerateDemented", score: 4.1 },
//       { label: "NonDemented",      score: 9.6 },
//       { label: "VeryMildDemented", score: 4.6 },
//     ],
//   },
//   {
//     prediction: "ModerateDemented", confidence: 88.3, is_dummy: true,
//     breakdown: [
//       { label: "MildDemented",     score: 5.2 },
//       { label: "ModerateDemented", score: 88.3 },
//       { label: "NonDemented",      score: 3.1 },
//       { label: "VeryMildDemented", score: 3.4 },
//     ],
//   },
//   {
//     prediction: "VeryMildDemented", confidence: 76.5, is_dummy: true,
//     breakdown: [
//       { label: "MildDemented",     score: 14.2 },
//       { label: "ModerateDemented", score: 2.8 },
//       { label: "NonDemented",      score: 6.5 },
//       { label: "VeryMildDemented", score: 76.5 },
//     ],
//   },
// ];

const ALZ_FALLBACKS: AlzheimerResult[] = [
  { prediction: "NonDemented",      is_dummy: true },
  { prediction: "MildDemented",     is_dummy: true },
  { prediction: "ModerateDemented", is_dummy: true },
  { prediction: "VeryMildDemented", is_dummy: true },
];



const RAG_FALLBACKS: Record<string, string> = {
  default:
    "Based on your uploaded report, the diagnosis indicates findings your care team is actively monitoring. Would you like me to explain any specific section or medical term?",
  explain:
    "In plain terms, your report shows changes that doctors want to track over time. Nothing immediately alarming, but regular follow-up is important. Your doctor will guide next steps at your appointment.",
  medication:
    "The medications in your report work together to manage your condition:\n\n• **Donepezil** — boosts brain chemical signals to support memory\n• **Memantine** — regulates glutamate activity, used for moderate-to-severe cases\n\nAlways take exactly as prescribed and report any side effects to your doctor.",
  risk:
    "Your report notes a few risk factors to monitor:\n\n• Age-related neurological changes\n• Cardiovascular health indicators\n• Sleep quality and activity levels\n\nMany of these respond well to lifestyle changes — aerobic exercise, a Mediterranean-style diet, and consistent sleep have strong evidence for slowing progression.",
};

function ragFallback(q: string): string {
  const l = q.toLowerCase();
  if (l.includes("explain") || l.includes("mean") || l.includes("simple")) return RAG_FALLBACKS.explain;
  if (l.includes("medic")   || l.includes("drug")  || l.includes("pill"))   return RAG_FALLBACKS.medication;
  if (l.includes("risk")    || l.includes("cause")  || l.includes("factor")) return RAG_FALLBACKS.risk;
  return RAG_FALLBACKS.default;
}

const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// ─── Public functions ─────────────────────────────────────────────────────────

export async function predictAlzheimer(file: File): Promise<AlzheimerResult> {
  const fd = new FormData();
  fd.append("image", file);
  const data = await tryBackend<AlzheimerResult>("/api/alzheimer/predict", { method: "POST", body: fd });
  if (data) return { ...data, fromFallback: false };
  return { ...pick(ALZ_FALLBACKS), fromFallback: true };
}

export async function predictTumor(file: File): Promise<TumorResult> {
  const fd = new FormData();
  fd.append("image", file);
  const data = await tryBackend<TumorResult>("/api/brain-tumor/predict", { method: "POST", body: fd });
  if (data) return { ...data, fromFallback: false };
  return { ...pick(TUMOR_FALLBACKS), fromFallback: true };
}

export async function ragUpload(file: File): Promise<RagUploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  const data = await tryBackend<RagUploadResult>("/api/rag/upload", { method: "POST", body: fd });
  if (data) return { ...data, fromFallback: false };
  return { session_id: `demo-${Date.now()}`, chunks_indexed: 0, fromFallback: true };
}

export async function ragQuery(sessionId: string, question: string): Promise<RagQueryResult> {
  if (sessionId.startsWith("demo-")) {
    return { answer: ragFallback(question), fromFallback: true };
  }
  const data = await tryBackend<RagQueryResult>("/api/rag/query", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ session_id: sessionId, question }),  // backend expects "question"
  });
  if (data) return { ...data, fromFallback: false };
  return { answer: ragFallback(question), fromFallback: true };
}
