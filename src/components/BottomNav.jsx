export default function BottomNav({ page, setPage, user }) {
  const matchCount = user?.matches?.length || 0;

  const items = [
    { label: "Gallery", page: "gallery", icon: "🖼" },
    { label: "Discover", page: "swipe",   icon: "✦" },
    { label: "Matches",  page: "matches", icon: "⇄" },
    { label: "Profile",  page: "profile", icon: "◎" },
  ];

  return (
    <>
      <style>{`
        @media (min-width: 601px) { .bottom-nav { display: none !important; } }
        @media (max-width: 600px)  { .top-nav-links { display: none !important; } }
      `}</style>
      <nav className="bottom-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", background: "rgba(245,240,232,0.97)",
        backdropFilter: "blur(14px)",
        borderTop: "1px solid rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {items.map(item => {
          const isActive = page === item.page;
          return (
            <button key={item.page} onClick={() => setPage(item.page)}
              style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 3, padding: "10px 0 8px",
                background: "none", border: "none", cursor: "pointer",
                position: "relative"
              }}>
              <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>{item.icon}</span>
              <span style={{
                fontSize: "0.55rem", letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: isActive ? "#c94b2d" : "#9e9589",
                fontFamily: "'DM Mono', monospace",
                fontWeight: isActive ? 600 : 400
              }}>{item.label}</span>
              {item.page === "matches" && matchCount > 0 && (
                <span style={{
                  position: "absolute", top: 6, left: "calc(50% + 6px)",
                  background: "#f97316", color: "white",
                  borderRadius: "50%", width: 15, height: 15,
                  fontSize: "0.48rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {matchCount > 9 ? "9+" : matchCount}
                </span>
              )}
              {isActive && (
                <span style={{
                  position: "absolute", top: 0, left: "50%",
                  transform: "translateX(-50%)",
                  width: 24, height: 2, background: "#c94b2d"
                }} />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
