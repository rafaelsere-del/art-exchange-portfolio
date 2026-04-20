import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import ArtSVG from "../components/ArtSVG";
import { NEGRO, VERDE, ORO, CREMA, CREMA_DARK, MUTED, BORDER, RADIUS } from "../styles/theme";

const MOCK_ARTWORKS = [
  { id: 1, title: "Golden Hour Study", artist: "Sofia Kwan",  initials: "SK", avatarBg: "#3d2a10", color1: "#c8b870", color2: "#d4a030", shape: "lines",    medium: "Oil · 120×90cm",        seeking: "ceramics",    status: "open"    },
  { id: 2, title: "Verdant No. 3",    artist: "Mina Vasquez", initials: "MV", avatarBg: "#1a2e20", color1: "#2d4a3e", color2: "#8fa58a", shape: "blocks",   medium: "Acrylic · 60×60cm",     seeking: "photography", status: "matched" },
  { id: 3, title: "Liminal Space I",  artist: "Yuki Tanaka",  initials: "YT", avatarBg: "#1e1a35", color1: "#3a3a5c", color2: "#7a7aac", shape: "circle",   medium: "Digital · Ed. 1/5",     seeking: "painting",    status: "open"    },
  { id: 4, title: "Descent",          artist: "Elton Marsh",  initials: "EM", avatarBg: "#382018", color1: "#c8a888", color2: "#a87858", shape: "triangle", medium: "Watercolour · 50×70cm", seeking: "any medium",  status: "open"    },
];

const MOCK_ARTISTS = [
  { initials: "SK", name: "Sofia Kwan",   location: "London, UK",  works: 4, bg: "#3d2a10" },
  { initials: "MV", name: "Mina Vasquez", location: "Barcelona",   works: 7, bg: "#1a2e20" },
  { initials: "YT", name: "Yuki Tanaka",  location: "Tokyo",       works: 2, bg: "#1e1a35" },
  { initials: "EM", name: "Elton Marsh",  location: "New York",    works: 5, bg: "#2e3d2a" },
  { initials: "CL", name: "Clara Liu",    location: "Paris",       works: 3, bg: "#1e2a38" },
];

function AxiaLogoSmall() {
  return (
    <svg width="170" height="26" viewBox="0 0 170 26" xmlns="http://www.w3.org/2000/svg">
      <text x="67" y="19" fontFamily="'Cormorant Garamond',serif" fontSize="16" fontWeight="400" letterSpacing="4" fill={CREMA} textAnchor="end">AXIA</text>
      <g transform="translate(77,5)">
        <line x1="0" y1="5" x2="11" y2="5" stroke={ORO} strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="11" y1="5" x2="8" y2="7.5" stroke={ORO} strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="11" y1="11" x2="0" y2="11" stroke={ORO} strokeWidth="0.7" strokeLinecap="round"/>
        <line x1="0" y1="11" x2="3" y2="8.5" stroke={ORO} strokeWidth="0.7" strokeLinecap="round"/>
      </g>
      <text x="98" y="19" fontFamily="'Cormorant Garamond',serif" fontSize="16" fontWeight="400" letterSpacing="4" fill={CREMA}>ART</text>
    </svg>
  );
}

const HOW_STEPS = [
  {
    n: "01", title: "List your work",
    desc: "Upload works you're willing to trade. Photos, paintings, sculpture, digital — if you made it, it belongs here.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="18" height="18" rx="1.5" stroke={ORO} strokeWidth="1"/>
        <line x1="6" y1="7" x2="16" y2="7" stroke={ORO} strokeWidth="1"/>
        <line x1="6" y1="11" x2="16" y2="11" stroke={ORO} strokeWidth="1"/>
        <line x1="6" y1="15" x2="11" y2="15" stroke={ORO} strokeWidth="1"/>
      </svg>
    )
  },
  {
    n: "02", title: "Discover & save",
    desc: "Browse works from artists around the world. Save the ones that move you. Take your time — this is about genuine connection.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="11" cy="11" r="8" stroke={ORO} strokeWidth="1"/>
        <circle cx="11" cy="11" r="3" stroke={ORO} strokeWidth="1"/>
        <line x1="11" y1="3" x2="11" y2="5" stroke={ORO} strokeWidth="1"/>
        <line x1="11" y1="17" x2="11" y2="19" stroke={ORO} strokeWidth="1"/>
        <line x1="3" y1="11" x2="5" y2="11" stroke={ORO} strokeWidth="1"/>
        <line x1="17" y1="11" x2="19" y2="11" stroke={ORO} strokeWidth="1"/>
      </svg>
    )
  },
  {
    n: "03", title: "Propose an exchange",
    desc: "Offer one of your works for theirs. Chat directly. No intermediaries, no platform fees. Just two artists agreeing on value.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="2" y1="11" x2="20" y2="11" stroke={ORO} strokeWidth="1"/>
        <line x1="20" y1="11" x2="15" y2="6" stroke={ORO} strokeWidth="1" strokeLinecap="round"/>
        <line x1="2" y1="11" x2="7" y2="16" stroke={ORO} strokeWidth="1" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    n: "04", title: "Ship & collect",
    desc: "Exchange your pieces. You're now an art collector — chosen by another artist who saw value in yours.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="9" width="16" height="11" rx="1.5" stroke={ORO} strokeWidth="1"/>
        <path d="M7.5 9V7a3.5 3.5 0 0 1 7 0v2" stroke={ORO} strokeWidth="1"/>
        <circle cx="11" cy="14.5" r="1.5" fill={ORO}/>
      </svg>
    )
  },
];

const CARD = { borderRadius: 16, overflow: "hidden" };

export default function HomePage({ setPage }) {
  const [featuredArtists, setFeaturedArtists] = useState(null);
  const [featuredArtworks, setFeaturedArtworks] = useState(null);
  const [heroArtworks, setHeroArtworks] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "homepage"));
        if (!snap.exists()) { setFeaturedArtists([]); setFeaturedArtworks([]); return; }
        const { artistSnapshots = [], artworkSnapshots = [], heroSnapshots = [] } = snap.data();
        setFeaturedArtists(artistSnapshots);
        setFeaturedArtworks(artworkSnapshots);
        setHeroArtworks(heroSnapshots);
      } catch (e) {
        console.error("[HomePage] Firestore load error:", e.code, e.message);
        setFeaturedArtists([]);
        setFeaturedArtworks([]);
        setHeroArtworks([]);
      }
    };
    load();
  }, []);

  // Use real data if loaded, fall back to mocks while loading or if empty
  const displayHeroArtworks   = (heroArtworks    && heroArtworks.length    > 0) ? heroArtworks    : MOCK_ARTWORKS;
  const displayArtworks       = (featuredArtworks && featuredArtworks.length > 0) ? featuredArtworks : MOCK_ARTWORKS;
  const displayArtists        = (featuredArtists  && featuredArtists.length  > 0) ? featuredArtists  : MOCK_ARTISTS;
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "white", padding: 12, paddingTop: 70, display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        .home-hero { display: grid; grid-template-columns: 3fr 2fr; min-height: 480px; }
        .hero-art-grid { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 3px; padding: 3px; }
        .works-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .how-steps { display: grid; grid-template-columns: repeat(4, 1fr); }
        .artist-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
        .home-footer { display: flex; justify-content: space-between; align-items: center; }

        @media (max-width: 600px) {
          .home-hero { grid-template-columns: 1fr !important; }
          .hero-art-grid { display: none !important; }
          .hero-left { padding: 40px 24px 36px !important; }
          .works-grid { grid-template-columns: 1fr !important; }
          .how-steps { grid-template-columns: 1fr 1fr !important; }
          .artist-grid { grid-template-columns: 1fr 1fr !important; }
          .home-footer { flex-direction: column; gap: 20px; text-align: center; }
          .footer-links { flex-wrap: wrap; justify-content: center; }
          .stats-bar { flex-wrap: wrap; }
        }
      `}</style>

      {/* HERO CARD */}
      <div style={CARD}>
        <div className="home-hero" style={{ background: VERDE }}>
          <div className="hero-left" style={{ padding: "4.5rem 2.5rem 4rem", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "left" }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.8rem,4vw,3.4rem)", fontWeight: 400, lineHeight: 1.05, color: CREMA, marginBottom: "1.25rem", letterSpacing: 0 }}>
              Where artists become<br /><em>collectors.</em>
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 300, color: "#b8c8a8", lineHeight: 1.75, maxWidth: 340, marginBottom: "1.75rem" }}>
              Exchange your work with artists you admire. No money. No galleries. Just the pure transfer of creative vision between people who understand its value.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="3.5" x2="20" y2="3.5" stroke={ORO} strokeWidth="1" strokeLinecap="round"/>
                <polyline points="14,0 20,3.5 14,7" fill="none" stroke={ORO} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
                <line x1="20" y1="10.5" x2="0" y2="10.5" stroke={ORO} strokeWidth="1" strokeLinecap="round"/>
                <polyline points="6,7 0,10.5 6,14" fill="none" stroke={ORO} strokeWidth="1" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "#6a8a5a" }}>The art exchange</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setPage("auth")}
                style={{ background: CREMA, color: NEGRO, fontSize: "12px", letterSpacing: "0.09em", textTransform: "uppercase", padding: "13px 28px", borderRadius: RADIUS, border: "none", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 500 }}
                onMouseOver={e => e.currentTarget.style.opacity = "0.88"}
                onMouseOut={e => e.currentTarget.style.opacity = "1"}
              >
                Apply to join
              </button>
              <button
                onClick={() => document.getElementById("works")?.scrollIntoView({ behavior: "smooth" })}
                style={{ background: "transparent", color: CREMA, fontSize: "12px", letterSpacing: "0.09em", textTransform: "uppercase", padding: "12px 28px", borderRadius: RADIUS, border: `1.5px solid ${CREMA}`, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 400 }}
                onMouseOver={e => { e.currentTarget.style.background = "rgba(247,245,240,0.1)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}
              >
                See the works
              </button>
            </div>
          </div>

          <div className="hero-art-grid">
            {displayHeroArtworks.map(art => (
              <div key={art.id} style={{ position: "relative", overflow: "hidden", minHeight: 130 }}>
                {art.imageUrl
                  ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <ArtSVG artwork={art} width={400} height={220} />
                }
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", background: "linear-gradient(to top, rgba(20,18,14,0.8) 0%, transparent 100%)" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "9px 11px" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: CREMA, fontWeight: 400, lineHeight: 1.2 }}>{art.title}</div>
                  <div style={{ fontSize: 10, color: "rgba(247,245,240,0.55)" }}>{art.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STATS — inside hero card */}
        <div className="stats-bar" style={{ background: NEGRO, display: "flex", justifyContent: "center" }}>
          {[
            { n: "4.2k", l: "Artists" },
            { n: "1.8k", l: "Works listed" },
            { n: "930+", l: "Exchanges completed" },
            { n: "38",   l: "Countries" },
          ].map(s => (
            <div key={s.l} style={{ padding: "1.25rem 2.5rem", textAlign: "center", borderRight: "0.5px solid #222018", flex: "1 1 auto" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400, color: CREMA }}>{s.n}</div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#5a5848", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* WORKS CARD */}
      <div id="works" style={{ ...CARD, background: CREMA }}>
        <div style={{ padding: "3.5rem 2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.75rem" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 400, color: NEGRO }}>Available for exchange</h2>
            <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: MUTED, borderBottom: `0.5px solid ${BORDER}`, paddingBottom: 1, cursor: "pointer" }}>View all 1,847 works →</span>
          </div>
          <div className="works-grid">
            {displayArtworks.map(art => (
              <div key={art.id} style={{ borderRadius: 4, overflow: "hidden", border: `0.5px solid ${BORDER}`, background: "white" }}>
                <div style={{ height: 175, overflow: "hidden", position: "relative" }}>
                  {art.imageUrl
                    ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    : <ArtSVG artwork={art} width={400} height={175} />
                  }
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "36%", background: "linear-gradient(to bottom, rgba(20,18,14,0.25) 0%, transparent 100%)" }} />
                  <div style={{
                    position: "absolute", top: 9, left: 9,
                    fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase",
                    padding: "3px 8px", borderRadius: 2, fontFamily: "'DM Sans', sans-serif",
                    ...(art.status === "open"
                      ? { background: "rgba(46,61,42,0.13)", color: "#2e3d2a", border: "0.5px solid rgba(46,61,42,0.32)" }
                      : { background: "rgba(106,114,96,0.1)", color: "#4a5240", border: "0.5px solid rgba(106,114,96,0.28)" })
                  }}>
                    {art.status === "open" ? "Open" : "Matched"}
                  </div>
                  <div style={{
                    position: "absolute", bottom: 9, right: 9,
                    width: 27, height: 27, borderRadius: "50%",
                    border: `1px solid rgba(184,149,58,0.4)`,
                    background: art.avatarBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Cormorant Garamond', serif", fontSize: 10, color: CREMA
                  }}>
                    {art.initials}
                  </div>
                </div>
                <div style={{ padding: "10px 12px 12px" }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.09em", textTransform: "uppercase", color: "#a09870", marginBottom: 3 }}>{art.medium}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: NEGRO, lineHeight: 1.2, marginBottom: 2 }}>{art.title}</div>
                  <div style={{ fontSize: 11, color: MUTED, marginBottom: 8 }}>{art.artist}</div>
                  <hr style={{ border: "none", borderTop: `0.5px solid ${CREMA_DARK}`, marginBottom: 8 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: "#a09870" }}>Seeking <span style={{ color: MUTED }}>{art.seeking}</span></div>
                    {art.status === "open" ? (
                      <button onClick={() => setPage("auth")} style={{ background: VERDE, color: CREMA, fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase", padding: "5px 11px", borderRadius: 2, border: "none", fontFamily: "'DM Sans', sans-serif", cursor: "pointer", fontWeight: 400 }}>
                        Offer exchange
                      </button>
                    ) : (
                      <span style={{ fontSize: 9, letterSpacing: "0.07em", textTransform: "uppercase", color: "#a09870", fontFamily: "'DM Sans', sans-serif" }}>Matched</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS CARD */}
      <div style={CARD}>
        <div style={{ background: "#1e2a1a", padding: "4.5rem 2.5rem" }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 400, color: CREMA, textAlign: "center", marginBottom: "0.4rem" }}>Four moves. One exchange.</h2>
          <p style={{ fontSize: 12, color: "#7a9068", textAlign: "center", letterSpacing: "0.05em", marginBottom: "3rem" }}>The entire process from listing to collecting.</p>
          <div className="how-steps">
            {HOW_STEPS.map((s, i) => (
              <div key={s.n} style={{ padding: "1.75rem", borderRight: i < 3 ? `0.5px solid #2e3e28` : "none", textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 300, color: "rgba(247,245,240,0.18)", lineHeight: 1, marginBottom: "0.75rem" }}>{s.n}</div>
                <div style={{ margin: "0 auto 0.85rem", width: 42, height: 42, border: `1px solid rgba(184,149,58,0.45)`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: CREMA, marginBottom: "0.5rem", fontWeight: 400 }}>{s.title}</div>
                <p style={{ fontSize: 12, color: "#8a9e7a", lineHeight: 1.65, fontWeight: 300 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ARTISTS CARD */}
      <div style={{ ...CARD, background: CREMA }}>
        <div style={{ padding: "3.5rem 2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.75rem" }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 400, color: NEGRO }}>Artists on Axia</h2>
            <span style={{ fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: MUTED, borderBottom: `0.5px solid ${BORDER}`, paddingBottom: 1, cursor: "pointer" }}>Meet all artists →</span>
          </div>
          <div className="artist-grid">
            {displayArtists.map(a => (
              <div key={a.uid || a.initials} style={{ border: `0.5px solid ${BORDER}`, borderRadius: 4, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: 130, background: a.bg || "#2e3d2a", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: CREMA }}>
                  {a.profileImageUrl
                    ? <img src={a.profileImageUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : (a.initials || a.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase())
                  }
                </div>
                <div style={{ padding: "9px 11px 11px", background: "white" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: NEGRO, marginBottom: 1 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: MUTED }}>{a.location}</div>
                  <div style={{ fontSize: 10, color: VERDE, marginTop: 3, fontWeight: 500 }}>{a.artworkCount ?? a.works} works listed</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER CARD */}
      <div style={CARD}>
        <footer className="home-footer" style={{ background: NEGRO, padding: "2.5rem" }}>
          <AxiaLogoSmall />
          <p style={{ fontSize: 12, color: "#8a8878", maxWidth: 220, lineHeight: 1.6 }}>
            Where artists become collectors. The pure exchange of creative vision.
          </p>
          <div className="footer-links" style={{ display: "flex", gap: 18 }}>
            {["About", "Privacy", "Terms", "Contact"].map(l => (
              <span key={l} style={{ fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "#7a7868", cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
