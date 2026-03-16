export default function FallbackBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", background: "rgba(245,158,11,.07)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 8, marginBottom: 14 }}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5" stroke="#f59e0b" strokeWidth="1.1"/>
        <path d="M6 4v3M6 8.2v.3" stroke="#f59e0b" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
      <span className="font-mono" style={{ fontSize: 10, color: "var(--amber)", letterSpacing: ".05em" }}>DEMO — backend offline, showing sample data</span>
    </div>
  );
}
