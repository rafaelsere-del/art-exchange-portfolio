import { RADIUS } from "../styles/theme";

const navStyle = {
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "10px 20px",
  background: "rgba(245,240,232,0.9)",
  backdropFilter: "blur(14px)",
  borderBottom: "1px solid rgba(0,0,0,0.08)"
};

const logoStyle = {
  background: "none", border: "none", cursor: "pointer",
  fontFamily: "'Playfair Display',serif", fontSize: "1.1rem",
  fontWeight: 900, color: "#0d0d0d"
};

export default function Nav({ page, setPage, user }) {
  const matchCount = user?.matches?.length || 0;

  return (
    <nav style={navStyle}>
      <button onClick={() => setPage(user ? "swipe" : "home")} style={logoStyle}>
        ART<span style={{ color: "#c94b2d", fontStyle: "italic" }}>x</span>ART
      </button>
      <div className="top-nav-links" style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {user ? (<>
          {[["Discover","swipe"],["My Gallery","gallery"],["Matches","matches"]].map(([label, p]) => (
            <button key={p} onClick={() => setPage(p)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase",
              color: page === p ? "#c94b2d" : "#0d0d0d",
              opacity: page === p ? 1 : 0.55,
              borderBottom: page === p ? "1px solid #c94b2d" : "1px solid transparent",
              paddingBottom: 2, position: "relative"
            }}>
              {label}
              {p === "matches" && matchCount > 0 && (
                <span style={{
                  position: "absolute", top: -8, right: -12,
                  background: "#f97316", color: "white",
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
            background: "#c94b2d", color: "white",
            border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem"
          }}>
            {user.name[0].toUpperCase()}
          </button>
        </>) : (
          <button onClick={() => setPage("auth")} style={{
            background: "#0d0d0d", color: "#f5f0e8",
            padding: "10px 22px", border: "none", cursor: "pointer",
            fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase",
            borderRadius: RADIUS
          }}>
            Join / Sign In
          </button>
        )}
      </div>
    </nav>
  );
}
