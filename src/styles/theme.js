// src/styles/theme.js
// Central place for shared design tokens

export const NEGRO      = "#14120e";
export const VERDE      = "#2e3d2a";
export const ORO        = "#b8953a";
export const CREMA      = "#f7f5f0";
export const CREMA_DARK = "#e8e4db";
export const MUTED      = "#6a7260";
export const BORDER     = "#c8c4b4";

export const RADIUS = 2;

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
  fontFamily: "'DM Sans', sans-serif",
  transition: "background 0.2s, opacity 0.2s",
  ...extra
});

export const btnPrimary = (extra = {}) => btn(NEGRO, CREMA, extra);
export const btnAccent  = (extra = {}) => btn(VERDE, CREMA, extra);
export const btnOutline = (extra = {}) => btn("transparent", CREMA, {
  border: `1.5px solid ${CREMA}`, ...extra
});
export const btnDanger  = (extra = {}) => btn("transparent", ORO, {
  border: `1.5px solid ${ORO}`, ...extra
});
