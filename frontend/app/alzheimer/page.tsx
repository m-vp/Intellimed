"use client";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import UploadZone from "@/components/UploadZone";
import FallbackBadge from "@/components/FallbackBadge";
import { predictAlzheimer, type AlzheimerResult, type AlzheimerLabel } from "@/lib/api";

// Exact labels the backend returns
const LABELS: AlzheimerLabel[] = [
  "MildDemented",
  "ModerateDemented",
  "NonDemented",
  "VeryMildDemented",
];

const META: Record<AlzheimerLabel, { color: string; display: string; stage: number; recommendation: string }> = {
  NonDemented:      { color: "#00b4a0", display: "Non Demented",       stage: 0, recommendation: "No significant markers detected. Routine annual cognitive screening recommended for preventive monitoring." },
  VeryMildDemented: { color: "#00d4ff", display: "Very Mild Demented", stage: 1, recommendation: "Very mild changes noted. Lifestyle modifications (exercise, diet, quality sleep) and 12-month follow-up imaging advised." },
  MildDemented:     { color: "#f59e0b", display: "Mild Demented",      stage: 2, recommendation: "Early intervention recommended. Neuropsychological evaluation and 6-month follow-up imaging advised." },
  ModerateDemented: { color: "#ff4d6a", display: "Moderate Demented",  stage: 3, recommendation: "Immediate specialist consultation required. Comprehensive neuropsychological evaluation and treatment planning advised." },
};

const STAGE_LABELS = ["Non\nDemented", "Very Mild", "Mild", "Moderate"];
const STAGE_COLORS = ["#00b4a0", "#00d4ff", "#f59e0b", "#ff4d6a"];

export default function AlzheimerPage() {
  const [file, setFile]         = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult]     = useState<AlzheimerResult | null>(null);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setResult(null); setProgress(0);
    const iv = setInterval(() => setProgress(p => Math.min(p + 6, 88)), 280);
    const data = await predictAlzheimer(file);
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
            <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(0,212,255,.1)", border: "1px solid rgba(0,212,255,.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#00d4ff" strokeWidth="1.4"/>
                <circle cx="11" cy="11" r="3" fill="rgba(0,212,255,.3)" stroke="#00d4ff" strokeWidth="1.4"/>
                <path d="M11 3v3M11 16v3M3 11h3M16 11h3" stroke="#00d4ff" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 9, color: "var(--cyan)", letterSpacing: ".1em", marginBottom: 2 }}>MODULE · ALZ-DETECT</div>
              <h1 className="font-syne" style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.5px" }}>Alzheimer's Disease Classification</h1>
            </div>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14, maxWidth: 580, lineHeight: 1.75 }}>
            Upload a brain MRI scan. The model classifies it into one of four cognitive stages and returns a confidence breakdown across all classes.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "600px", justifyContent: "center", gap: 20 }}>

          {/* ── Upload card ── */}
          <div className="card" style={{ padding: 26 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 className="font-syne" style={{ fontSize: 15, fontWeight: 700 }}>Upload MRI Scan</h2>
              <span className="font-mono" style={{ fontSize: 9, color: "var(--text-3)" }}>AXIAL · SAGITTAL · CORONAL</span>
            </div>

            <UploadZone
              onFile={f => { setFile(f); setResult(null); }}
              accept="image/*"
              label="Drop your MRI scan here"
              hint="PNG, JPG, TIFF, BMP · Max 50 MB"
            />

            {/* Stage legend */}
            <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {STAGE_LABELS.map((s, i) => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 11px", background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.04)", borderRadius: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: STAGE_COLORS[i], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>Stage {i}: {s.replace("\n", " ")}</span>
                </div>
              ))}
            </div>

            {/* Progress */}
            {loading && (
              <div style={{ marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: "var(--text-2)" }}>Running classification…</span>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--cyan)" }}>{progress}%</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${progress}%`, background: "linear-gradient(90deg,var(--cyan),var(--teal))" }} />
                </div>
              </div>
            )}

            <button className="btn" style={{ marginTop: 18 }} disabled={!file || loading} onClick={analyze}>
              {loading ? <><div className="spinner" />Analyzing…</> : "Run Classification"}
            </button>
          </div>

          {/* ── Result card ── */}
          {result && meta && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="fade-up">
              {result.fromFallback && <FallbackBadge />}

              {/* Main result */}
              <div className="card" style={{ padding: 26, borderColor: `${meta.color}28`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${meta.color},transparent)` }} />
                <div style={{ position: "absolute", top: -50, right: -50, width: 160, height: 160, borderRadius: "50%", background: `radial-gradient(circle,${meta.color}12 0%,transparent 70%)`, pointerEvents: "none" }} />

                <div className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: ".1em", marginBottom: 14 }}>CLASSIFICATION RESULT</div>

                <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 14 }}>
                  <h2 className="font-syne" style={{ fontSize: 24, fontWeight: 800, color: meta.color }}>{meta.display}</h2>
                  <div className="font-mono" style={{ fontSize: 26, fontWeight: 300, color: meta.color, opacity: .75, marginBottom: 1 }}>{result.confidence.toFixed(1)}%</div>
                </div>

                {/* Stage strip */}
                <div style={{ display: "flex", gap: 5, marginBottom: 14 }}>
                  {STAGE_LABELS.map((s, i) => (
                    <div key={s} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ height: 3, borderRadius: 2, marginBottom: 4, background: i <= meta.stage ? STAGE_COLORS[i] : "rgba(255,255,255,.05)" }} />
                      <span style={{ fontSize: 8, color: i <= meta.stage ? STAGE_COLORS[i] : "var(--text-3)" }}>{s.replace("\n", " ")}</span>
                    </div>
                  ))}
                </div>

                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${result.confidence}%`, background: `linear-gradient(90deg,${meta.color}60,${meta.color})` }} />
                </div>
              </div>

              {/* Breakdown */}
              <div className="card" style={{ padding: 22 }}>
                <div className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: ".1em", marginBottom: 14 }}>CLASS BREAKDOWN</div>
                {result.breakdown.map((item, i) => {
                  const m = META[item.label as AlzheimerLabel];
                  return (
                    <div key={item.label} style={{ marginBottom: 11 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: "var(--text-2)" }}>{m?.display ?? item.label}</span>
                        <span className="font-mono" style={{ fontSize: 11, color: m?.color ?? "var(--cyan)" }}>{item.score.toFixed(1)}%</span>
                      </div>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${item.score}%`, background: `linear-gradient(90deg,${(m?.color ?? "#00d4ff")}55,${m?.color ?? "#00d4ff"})` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation */}
              <div style={{ padding: 18, background: "rgba(245,158,11,.05)", border: "1px solid rgba(245,158,11,.14)", borderRadius: 12 }}>
                <div className="font-mono" style={{ fontSize: 9, color: "var(--amber)", letterSpacing: ".08em", marginBottom: 7 }}>CLINICAL RECOMMENDATION</div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7 }}>{meta.recommendation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
