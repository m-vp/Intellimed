"use client";
import { useRef, useState, useCallback } from "react";

interface Props {
  onFile: (f: File) => void;
  accept?: string;
  label?: string;
  hint?: string;
  accentColor?: string;
}

export default function UploadZone({ onFile, accept = "image/*", label = "Drop file here", hint = "PNG, JPG, TIFF", accentColor = "var(--cyan)" }: Props) {
  const [drag, setDrag]       = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName]       = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  const handle = useCallback((f: File) => {
    setName(f.name);
    onFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = e => setPreview(e.target?.result as string);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, [onFile]);

  return (
    <div
      className={`upload-zone ${drag ? "drag" : ""}`}
      style={{ minHeight: 190, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}
      onDragOver={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      onClick={() => ref.current?.click()}
    >
      {drag && <div className="scan-line" />}

      {preview ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ position: "relative", display: "inline-block", borderRadius: 10, overflow: "hidden", border: `1px solid rgba(0,212,255,.18)` }}>
            <img src={preview} alt="preview" style={{ maxWidth: 240, maxHeight: 160, objectFit: "contain", display: "block" }} />
            <div className="scan-line" />
          </div>
          <div className="font-mono" style={{ marginTop: 10, fontSize: 11, color: accentColor }}>{name}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>click to change</div>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: .45 }}>
            <rect x="6" y="6" width="32" height="32" rx="7" stroke={accentColor} strokeWidth="1.4" strokeDasharray="4 3"/>
            <path d="M22 16v12M16 22l6-6 6 6" stroke={accentColor} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{ fontSize: 14, fontWeight: 500, color: "var(--text-1)", marginBottom: 5 }}>{label}</div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>{hint}</div>
          <div style={{ marginTop: 14, fontSize: 12, color: accentColor, background: `rgba(0,212,255,.07)`, border: `1px solid rgba(0,212,255,.18)`, borderRadius: 8, padding: "5px 14px", display: "inline-block" }}>Browse</div>
        </div>
      )}

      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}
