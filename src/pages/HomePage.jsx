import ArtSVG from "../components/ArtSVG";
import { RADIUS } from "../styles/theme";

const MOCK_ARTWORKS = [
  { id: 1, title: "Golden Hour Study", artist: "Sofia Kwan", color1: "#c9952d", color2: "#c94b2d", shape: "lines" },
  { id: 2, title: "Descent", artist: "Elton Marsh", color1: "#1a1a2e", color2: "#c94b2d", shape: "triangle" },
  { id: 3, title: "Verdant No. 3", artist: "Mina Vasquez", color1: "#2d4a3e", color2: "#8fa58a", shape: "blocks" },
  { id: 4, title: "Liminal Space I", artist: "Yuki Tanaka", color1: "#3a3a5c", color2: "#7a7aac", shape: "circle" },
];

export default function HomePage({ setPage }) {
  return (
    <div>
      <style>{`
        @media (max-width: 600px) {
          .home-hero { grid-template-columns: 1fr !important; }
          .home-hero-image { display: none !important; }
          .home-hero-text { padding: 40px 28px 40px !important; }
          .home-steps { grid-template-columns: 1fr !important; border-left: none !important; }
          .home-step { border-right: none !important; border-bottom: 1px solid rgba(0,0,0,0.1); }
          .home-steps-section { padding: 60px 28px !important; }
        }
      `}</style>

      <div className="home-hero" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", paddingTop: 80 }}>
        <div className="home-hero-text" style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 56px 80px 72px" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 20 }}>The Art Exchange</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(3rem,5vw,5.2rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 24 }}>
            Your art<br />for <em style={{ color: "#c94b2d" }}>their</em><br />art.
          </h1>
          <p style={{ fontSize: "0.86rem", lineHeight: 1.8, color: "#9e9589", maxWidth: 370, marginBottom: 36 }}>
            A platform where artists become collectors. Swap your work for theirs. No money. No galleries. Just the pure exchange of creative souls.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => setPage("auth")} style={{ background: "#c94b2d", color: "white", padding: "15px 30px", border: "none", cursor: "pointer", fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: RADIUS }}
              onMouseOver={e => e.target.style.background = "#e8613e"} onMouseOut={e => e.target.style.background = "#c94b2d"}>
              Start Swapping →
            </button>
            <button onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: "#0d0d0d", padding: "15px 22px", border: "1.5px solid #0d0d0d", cursor: "pointer", fontSize: "0.74rem", letterSpacing: "0.06em", textTransform: "uppercase", borderRadius: RADIUS }}
              onMouseOver={e => { e.target.style.background = "#0d0d0d"; e.target.style.color = "#f5f0e8"; }}
              onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = "#0d0d0d"; }}>
              How It Works
            </button>
          </div>
        </div>

        <div className="home-hero-image" style={{ background: "#ede8dc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", fontFamily: "'Playfair Display',serif", fontSize: "18vw", fontWeight: 900, color: "rgba(0,0,0,0.04)", pointerEvents: "none", letterSpacing: "-0.03em" }}>SWAP</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, position: "relative", zIndex: 2 }}>
            {MOCK_ARTWORKS.map((art,i) => (
              <div key={art.id} style={{ width: 148, height: 178, background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: `rotate(${[-2,3,-1,2][i]}deg)`, overflow: "hidden", borderRadius: RADIUS, transition: "transform 0.3s" }}
                onMouseOver={e => e.currentTarget.style.transform = "rotate(0deg) scale(1.04)"}
                onMouseOut={e => e.currentTarget.style.transform = `rotate(${[-2,3,-1,2][i]}deg)`}>
                <ArtSVG artwork={art} width={148} height={120} />
                <div style={{ padding: "7px 9px" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.7rem", fontWeight: 700 }}>{art.title}</div>
                  <div style={{ fontSize: "0.56rem", color: "#9e9589" }}>{art.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="how" className="home-steps-section" style={{ padding: "96px 72px" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 14 }}>The Process</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 56 }}>Four moves.<br />One exchange.</h2>
        <div className="home-steps" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderLeft: "1px solid rgba(0,0,0,0.1)" }}>
          {[
            { n:"01", icon:"🖼", title:"List Your Work", desc:"Upload artworks you're willing to trade. Photos, paintings, sculptures, digital — if you made it, it belongs here." },
            { n:"02", icon:"👁", title:"Browse & Swipe", desc:"Swipe right to want, left to pass. When both artists want each other's work, it's a match." },
            { n:"03", icon:"🤝", title:"Negotiate", desc:"Chat directly. Agree on what to swap. No platform fee. No intermediary. Just you and the other artist." },
            { n:"04", icon:"📦", title:"Ship & Collect", desc:"Exchange your pieces. You're now an art collector — chosen by another artist who saw value in yours." },
          ].map(s => (
            <div key={s.n} className="home-step" style={{ padding: "32px 28px", borderRight: "1px solid rgba(0,0,0,0.1)", transition: "background 0.3s" }}
              onMouseOver={e => e.currentTarget.style.background = "#ede8dc"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "3rem", fontWeight: 900, color: "rgba(0,0,0,0.05)", lineHeight: 1, marginBottom: 16 }}>{s.n}</div>
              <div style={{ fontSize: "1.4rem", marginBottom: 14 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: "0.73rem", lineHeight: 1.8, color: "#9e9589" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
