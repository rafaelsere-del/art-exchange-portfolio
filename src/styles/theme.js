// src/styles/theme.js
// Central place for shared design tokens

export const RADIUS = 5;

export const btn = (bg, color, extra = {}) => ({
  padding: "12px 20px",
  border: "none",
  cursor: "pointer",
  fontSize: "0.72rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  background: bg,
  color,
  borderRadius: RADIUS,
  fontFamily: "'DM Mono', monospace",
  transition: "background 0.2s, opacity 0.2s",
  ...extra
});

export const btnPrimary = (extra = {}) => btn("#0d0d0d", "#f5f0e8", extra);
export const btnAccent  = (extra = {}) => btn("#c94b2d", "white", extra);
export const btnOutline = (extra = {}) => btn("transparent", "#0d0d0d", {
  border: `1.5px solid rgba(0,0,0,0.15)`, ...extra
});
export const btnDanger  = (extra = {}) => btn("transparent", "#c94b2d", {
  border: `1.5px solid #c94b2d`, ...extra
});
