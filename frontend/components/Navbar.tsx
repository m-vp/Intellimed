"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/alzheimer",    label: "Alzheimer's" },
  { href: "/brain-tumor",  label: "Brain Tumor"  },
  { href: "/rag",          label: "Report Chat"  },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(4,7,15,.82)",
      backdropFilter: "blur(18px)",
      borderBottom: "1px solid rgba(0,212,255,.07)",
    }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,rgba(0,212,255,.18),rgba(0,180,160,.12))", border: "1px solid rgba(0,212,255,.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6" stroke="#00d4ff" strokeWidth="1.3"/>
              <path d="M5 8h6M8 5v6" stroke="#00d4ff" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="font-syne" style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.3px" }}>
              Intelli<span className="grad-cyan">Med</span>
            </div>
            <div className="font-mono" style={{ fontSize: 8, color: "var(--text-3)", letterSpacing: ".1em" }}>PREDICTIVE AI</div>
          </div>
        </Link>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 6 }}>
          {links.map(l => (
            <Link key={l.href} href={l.href} className={`nav-pill ${path === l.href ? "active" : ""}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 12px", background: "rgba(0,180,160,.07)", border: "1px solid rgba(0,180,160,.18)", borderRadius: 100 }}>
          <div className="pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--teal)", flexShrink: 0 }} />
          <span className="font-mono" style={{ fontSize: 10, color: "var(--teal)", letterSpacing: ".06em" }}>ONLINE</span>
        </div>
      </div>
    </nav>
  );
}
