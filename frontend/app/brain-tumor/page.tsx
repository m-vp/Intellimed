"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";
import FallbackBadge from "@/components/FallbackBadge";
import { predictTumor, type TumorResult, type TumorLabel } from "@/lib/api";

const META: Record<TumorLabel, { color: string; raw: string; display: string; detected: boolean }> = {
  glioma:      { color: "var(--red)",    raw: "#ff4d6a", display: "Glioma",      detected: true  },
  meningioma:  { color: "var(--red)",    raw: "#ff4d6a", display: "Meningioma",  detected: true  },
  pituitary:   { color: "var(--amber)",  raw: "#f59e0b", display: "Pituitary",   detected: true  },
  notumor:     { color: "var(--teal)",   raw: "#00b4a0", display: "No Tumor",    detected: false },
};

export default function BrainTumorPage() {
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState<TumorResult | null>(null);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p + 5, 88)), 300);
    const data = await predictTumor(file);
    clearInterval(iv); setProgress(100);
    setResult(data); setLoading(false);
  };

  const meta = result ? META[result.prediction] : null;

  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(255,77,106,.1)", border: "1px solid rgba(255,77,106,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C7 3 3 7 3 12c0 3.1 1.5 5.9 3.9 7.7L7.5 22h9l.6-2.3C19.5 17.9 21 15.1 21 12c0-5-4-9-9-9z" stroke="#ff4d6a" strokeWidth="1.4" fill="rgba(255,77,106,.07)"/>
                <circle cx="12" cy="12" r="3" stroke="#ff4d6a" strokeWidth="1.4" fill="rgba(255,77,106,.2)"/>
              </svg>
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 9, color: "var(--red)", letterSpacing: ".1em", marginBottom: 2 }}>MODULE · ONCO-DETECT</div>
              <h1 className="font-syne" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.5px" }}>Brain Tumor Detection</h1>
            </div>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 580, lineHeight: 1.75 }}>
            Upload a brain MRI scan. The model classifies it as glioma, meningioma, pituitary tumor, or no tumor.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "600px", justifyContent: "center", gap: 20 }}>

          {/* ── Upload card ── */}
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="font-syne" style={{ fontSize: 15, fontWeight: 700 }}>Upload MRI Scan</h2>
              <span className="font-mono" style={{ fontSize: 9, color: "var(--text-3)" }}>T1 · T2 · FLAIR</span>
            </div>

            <UploadZone
              onFile={f => { setFile(f); setResult(null); }}
              accept="image/*"
              label="Drop your brain MRI here"
              hint="PNG, JPG, TIFF, BMP · Max 50 MB"
              accentColor="var(--red)"
            />

            {/* Legend */}
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {(Object.entries(META) as [TumorLabel, typeof META[TumorLabel]][]).map(([key, m]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: m.raw }} />
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>{m.display}</span>
                </div>
              ))}
            </div>

            {loading && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>Scanning for anomalies…</span>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--red)" }}>{progress}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#ff4d6a80,#ff4d6a)" }} />
                </div>
              </div>
            )}

            <button className="btn btn-red" style={{ marginTop: 18 }} disabled={!file || loading} onClick={analyze}>
              {loading ? <><div className="spinner spinner-red" />Scanning…</> : "Detect Tumor"}
            </button>
          </div>

          {/* ── Result card ── */}
          {result && meta && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              {result.fromFallback && <FallbackBadge />}

              {/* Big verdict */}
              <div className="card" style={{ padding: 36, borderColor: `${meta.raw}28`, position: "relative", overflow: "hidden", textAlign: "center" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${meta.raw},transparent)` }} />
                <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 30%,${meta.raw}08 0%,transparent 60%)`, pointerEvents: "none" }} />

                {/* Icon */}
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${meta.raw}12`, border: `2px solid ${meta.raw}30`, margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {meta.detected ? (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="10" stroke={meta.raw} strokeWidth="1.8" fill={`${meta.raw}20`}/>
                      <circle cx="16" cy="16" r="4" fill={meta.raw}/>
                    </svg>
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <circle cx="16" cy="16" r="10" stroke="#00b4a0" strokeWidth="1.8" fill="rgba(0,180,160,.12)"/>
                      <path d="M11 16l4 4 6-7" stroke="#00b4a0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                <h2 className="font-syne" style={{ fontSize: 28, fontWeight: 800, color: meta.color, marginBottom: 6 }}>
                  {meta.detected ? `${meta.display} Detected` : "No Tumor Detected"}
                </h2>

                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  {meta.detected
                    ? `The model identified tissue patterns consistent with ${meta.display.toLowerCase()}.`
                    : "The model found no significant abnormal tissue patterns."}
                </div>
              </div>

              {/* is_dummy indicator */}
              {result.is_dummy && !result.fromFallback && (
                <div style={{ padding: "10px 14px", background: "rgba(99,102,241,.06)", border: "1px solid rgba(99,102,241,.15)", borderRadius: 10 }}>
                  <span className="font-mono" style={{ fontSize: 10, color: "var(--violet)" }}>⚠ MODEL FILE MISSING — backend returned dummy output.</span>
                </div>
              )}

              {/* Clinical note */}
              <div style={{ padding: 18, background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.14)", borderRadius: 12 }}>
                <div className="font-mono" style={{ fontSize: 9, color: "var(--amber)", letterSpacing: ".08em", marginBottom: 7 }}>CLINICAL NOTE</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>
                  {meta.detected
                    ? "This is an AI-assisted screening result only. An urgent consultation with a neurologist or neurosurgeon is strongly recommended. Contrast-enhanced MRI and histopathological evaluation should follow."
                    : "No tumor markers detected in this scan. This result does not rule out all conditions. Continue routine follow-up as clinically advised."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}