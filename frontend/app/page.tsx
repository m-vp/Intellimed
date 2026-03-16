"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const modules = [
  {
    href: "/alzheimer",
    color: "var(--cyan)",
    glow:  "rgba(0,212,255,.12)",
    tag:   "ALZ·DETECT",
    title: "Alzheimer's Detection",
    desc:  "Upload a brain MRI scan and receive classification across 4 cognitive stages — from NonDemented to ModerateDemented — using a deep learning model.",
    out:   "MildDemented · ModerateDemented · NonDemented · VeryMildDemented",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <circle cx="13" cy="13" r="10" stroke="#00d4ff" strokeWidth="1.4" fill="rgba(0,212,255,.06)"/>
        <circle cx="13" cy="13" r="3.5" stroke="#00d4ff" strokeWidth="1.4" fill="rgba(0,212,255,.2)"/>
        <path d="M13 4v3M13 19v3M4 13h3M19 13h3" stroke="#00d4ff" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/brain-tumor",
    color: "var(--red)",
    glow:  "rgba(255,77,106,.12)",
    tag:   "ONCO·DETECT",
    title: "Brain Tumor Detection",
    desc:  "Submit a brain MRI and the model returns a simple yes/no result — whether a tumor is present — along with its confidence score.",
    out:   "Tumor Detected · No Tumor Detected",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <path d="M13 3C8 3 4 7 4 12c0 3.2 1.6 6 4 7.7L8.5 22h9l.5-2.3C20.4 18 22 15.2 22 12c0-5-4-9-9-9z" stroke="#ff4d6a" strokeWidth="1.4" fill="rgba(255,77,106,.06)"/>
        <circle cx="13" cy="12" r="3" stroke="#ff4d6a" strokeWidth="1.4" fill="rgba(255,77,106,.18)"/>
      </svg>
    ),
  },
  {
    href: "/rag",
    color: "var(--violet)",
    glow:  "rgba(99,102,241,.12)",
    tag:   "RAG·LLM",
    title: "Report Intelligence",
    desc:  "Upload your diagnosis report (PDF, image, or document) and chat with it. Powered by Gemini + RAG — ask anything in plain language.",
    out:   "Contextual answers grounded in your report",
    icon: (
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
        <rect x="3" y="3" width="13" height="17" rx="2" stroke="#6366f1" strokeWidth="1.4" fill="rgba(99,102,241,.06)"/>
        <path d="M7 8h6M7 12h6M7 16h4" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="19" cy="19" r="4.5" fill="rgba(99,102,241,.15)" stroke="#6366f1" strokeWidth="1.4"/>
        <path d="M17.5 19h3M19 17.5v3" stroke="#6366f1" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <div className="grid-bg" style={{ padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
        {/* Ambient orbs */}
        <div style={{ position: "absolute", top: -80, left: "25%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,212,255,.05) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 40, right: "18%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.04) 0%,transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1180, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", background: "rgba(0,212,255,.06)", border: "1px solid rgba(0,212,255,.14)", borderRadius: 100, marginBottom: 28 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--cyan)" }} />
            <span className="font-mono" style={{ fontSize: 10, color: "var(--cyan)", letterSpacing: ".08em" }}>ENTERPRISE MEDICAL AI · v2.0</span>
          </div>

          <h1 className="font-syne" style={{ fontSize: "clamp(36px,5.5vw,72px)", fontWeight: 800, lineHeight: 1.06, letterSpacing: "-1.5px", marginBottom: 20 }}>
            Predictive Medical<br /><span className="grad-cyan">Intelligence System</span>
          </h1>

          <p style={{ color: "var(--text-2)", fontSize: 17, maxWidth: 520, margin: "0 auto 48px", lineHeight: 1.75 }}>
            Clinical-grade AI diagnostics for neurological conditions. Upload scans, analyze reports, and understand your health.
          </p>

          {/* Quick stats */}
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 0 }}>
            {[["< 2s", "Inference"], ["HIPAA", "Compliant"], ["Gemini", "RAG Engine"], ["99.9%", "Uptime"]].map(([v, l], i, arr) => (
              <div key={l} style={{ padding: "0 24px", borderRight: i < arr.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none", textAlign: "center" }}>
                <div className="font-syne grad-cyan" style={{ fontSize: 22, fontWeight: 700 }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Module cards */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 }}>
          {modules.map(m => (
            <Link key={m.href} href={m.href} style={{ textDecoration: "none" }}>
              <div className="card" style={{ padding: 26, height: "100%", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", cursor: "pointer" }}>
                {/* Top color bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${m.color},transparent)` }} />
                {/* Ambient glow */}
                <div style={{ position: "absolute", top: -40, right: -40, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle,${m.glow} 0%,transparent 70%)`, pointerEvents: "none" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                  <div style={{ padding: 11, background: m.glow, border: `1px solid ${m.color}28`, borderRadius: 11 }}>{m.icon}</div>
                  <span className="tag font-mono" style={{ background: `${m.color}10`, border: `1px solid ${m.color}25`, color: m.color }}>{m.tag}</span>
                </div>

                <h2 className="font-syne" style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: "-.4px" }}>{m.title}</h2>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.75, flex: 1, marginBottom: 20 }}>{m.desc}</p>

                <div style={{ paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.04)" }}>
                  <div className="font-mono" style={{ fontSize: 10, color: "var(--text-3)", letterSpacing: ".04em", marginBottom: 4 }}>OUTPUT</div>
                  <div style={{ fontSize: 12, color: m.color }}>{m.out}</div>
                </div>

                <div style={{ position: "absolute", bottom: 24, right: 24, color: m.color, opacity: .4 }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 14L14 4M14 4H7M14 4v7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Disclaimer bar */}
        <div className="card" style={{ marginTop: 18, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-2)" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#f59e0b" strokeWidth="1.1"/><path d="M7 5v3M7 9.5v.5" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round"/></svg>
            AI predictions are assistive tools only. Always consult a qualified medical professional.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["HIPAA", "SOC 2", "ISO 27001"].map(b => (
              <span key={b} className="font-mono" style={{ fontSize: 9, color: "var(--text-3)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 6, padding: "3px 9px" }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
