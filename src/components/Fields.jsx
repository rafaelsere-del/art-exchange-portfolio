import { useState } from "react";

export function Field({ label, name, value, onChange, type = "text", placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6a7260", marginBottom: 5 }}>{label}</label>
      <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${focused ? "#b8953a" : "rgba(0,0,0,0.13)"}`, background: "#f7f5f0", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Sans',monospace", transition: "border-color 0.2s", boxSizing: "border-box" }} />
    </div>
  );
}

export function FieldArea({ label, name, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6a7260", marginBottom: 5 }}>{label}</label>
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${focused ? "#b8953a" : "rgba(0,0,0,0.13)"}`, background: "#f7f5f0", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Sans',monospace", resize: "vertical", transition: "border-color 0.2s", boxSizing: "border-box" }} />
    </div>
  );
}
