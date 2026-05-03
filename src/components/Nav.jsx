import { RADIUS, NEGRO, VERDE, ORO, CREMA, MUTED } from "../styles/theme";

function AxiaLogo({ fill = "#f7f5f0" }) {
  return (
    <svg width="260" height="38" viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
      <text x="104" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" fill={fill} textAnchor="end">AXIA</text>
      <g transform="translate(112,10)">
        <path d="M0,6.5 L18,6.5 L13.5,11" fill="none" stroke={ORO} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M18,16 L0,16 L4.5,11.5" fill="none" stroke={ORO} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
      <text x="148" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" fill={fill}>ART</text>
    </svg>
  );
}

export default function Nav({ page, setPage, user }) {
  const matchCount = user?.matches?.length || 0;
  const isHome = !user && page === "home";

  const navStyle = {
    position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 2.5rem", height: 58,
    background: isHome ? NEGRO : "rgba(247,245,240,0.9)",
    backdropFilter: isHome ? "none" : "blur(14px)",
    borderBottom: isHome ? "none" : `1px solid ${MUTED}22`
  };

  return (
    <nav style={navStyle}>
      <button onClick={() => setPage(user ? "swipe" : "home")} style={{ background: "none", border: "none", cursor: "pointer", lineHeight: 0 }}>
        <AxiaLogo fill={isHome ? CREMA : NEGRO} />
      </button>

      <div className="top-nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
        {user ? (
          <>
            {[["Discover", "swipe"], ["My Gallery", "gallery"], ["Matches", "matches"]].map(([label, p]) => (
              <button key={p} onClick={() => setPage(p)} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase",
                color: page === p ? ORO : NEGRO,
                opacity: page === p ? 1 : 0.55,
                borderBottom: page === p ? `1px solid ${ORO}` : "1px solid transparent",
                paddingBottom: 2, position: "relative"
              }}>
                {label}
                {p === "matches" && matchCount > 0 && (
                  <span style={{
                    position: "absolute", top: -8, right: -12,
                    background: ORO, color: CREMA,
                    borderRadius: "50%", width: 17, height: 17,
                    fontSize: "0.52rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1
                  }}>
                    {matchCount > 9 ? "9+" : matchCount}
                  </span>
                )}
              </button>
            ))}
            <button onClick={() => setPage("profile")} style={{
              width: 34, height: 34, borderRadius: "50%",
              background: VERDE, color: CREMA,
              border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem"
            }}>
              {user.name[0].toUpperCase()}
            </button>
          </>
        ) : (
          <button onClick={() => setPage("auth")} style={{
            background: CREMA, color: NEGRO,
            padding: "8px 20px", border: "none", cursor: "pointer",
            fontSize: "0.68rem", letterSpacing: "0.09em", textTransform: "uppercase",
            borderRadius: RADIUS, fontFamily: "'DM Sans', sans-serif", fontWeight: 500
          }}>
            Join
          </button>
        )}
      </div>
    </nav>
  );
}
