import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import ManifestoGrid from "../components/ManifestoGrid";
import WaitlistForm from "../components/WaitlistForm";
import "./HomePage.css";

const HERO_FALLBACK = [
  { id: 1, title: "The portrait of fire",  artist: "Rafael Sava", imageUrl: null, ph: "art-ph-1" },
  { id: 2, title: "King in blue",           artist: "Rafael Sava", imageUrl: null, ph: "art-ph-2" },
  { id: 3, title: "The wood is changing",   artist: "Rafael Sava", imageUrl: null, ph: "art-ph-3" },
  { id: 4, title: "It will come",           artist: "Rafael Sava", imageUrl: null, ph: "art-ph-4" },
];

const MOCK_ARTISTS = [
  { uid: 1, name: "Paula Jordana",  location: "Bucharest, Romania",  artworkCount: 3, profileImageUrl: null },
  { uid: 2, name: "Andrei Popescu", location: "Montevideo, Uruguay", artworkCount: 2, profileImageUrl: null },
  { uid: 3, name: "Luca Bianchi",   location: "Torino, Italy",       artworkCount: 4, profileImageUrl: null },
  { uid: 4, name: "Stefan Müller",  location: "Vienna, Austria",     artworkCount: 2, profileImageUrl: null },
  { uid: 5, name: "Rafael Sava",    location: "Lisbon, Portugal",    artworkCount: 7, profileImageUrl: null },
];

const PH_CLASSES = ["art-ph-1", "art-ph-2", "art-ph-3", "art-ph-4"];

function initials(name) {
  return name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
}

/* ─── Action system preview data ─── */
const ACTIONS = [
  {
    id: "resonance",
    icon: "◎",
    name: "Send resonance",
    desc: "A signal that this work moved you",
    tier: "free",
    tierLabel: "Free",
  },
  {
    id: "response",
    icon: "◌",
    name: "Open a response",
    desc: "Written reactions from the community",
    tier: "member",
    tierLabel: "Member",
  },
  {
    id: "dialogue",
    icon: "◈",
    name: "Start a dialogue",
    desc: "Peer-to-peer, private, structured",
    tier: "member",
    tierLabel: "Member",
  },
  {
    id: "exchange",
    icon: "⇄",
    name: "Propose an exchange",
    desc: "Trade work with another artist. No money.",
    tier: "founder",
    tierLabel: "Founder",
  },
];

const TIER_GUIDE = [
  {
    tier: "free",
    tierLabel: "Free",
    desc: "Discover works, send resonance, save to your personal collection, follow artists.",
  },
  {
    tier: "member",
    tierLabel: "Member",
    desc: "Upload your work, choose up to 3 actions per piece, access peer dialogue, gallery and collector feedback.",
  },
  {
    tier: "founder",
    tierLabel: "Founder",
    desc: "All member access, artwork exchange, governance voice, and a stake in what Axia becomes.",
  },
];

/* ─── Tier badge helper ─── */
function TierBadge({ tier, tierLabel }) {
  const styles = {
    free:    { background: "#E1F5EE", color: "#0F6E56" },
    member:  { background: "#FAEEDA", color: "#854F0B" },
    founder: { background: "#EEEDFE", color: "#3C3489" },
  };
  return (
    <span
      className="action-tier-badge"
      style={{
        fontSize: "11px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "4px",
        flexShrink: 0,
        ...(styles[tier] || {}),
      }}
    >
      {tierLabel}
    </span>
  );
}

/* ─── Action system preview section ─── */
function ActionPreview({ setPage }) {
  return (
    <section className="block action-preview-section">
      <div className="sec-panel">

        <div className="sec-head" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.4rem", marginBottom: "2rem" }}>
          <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ash, #8c8075)", margin: 0 }}>
            Inside Axia
          </p>
          <h2 style={{ margin: 0 }}>The artist chooses what the work invites.</h2>
          <p style={{ fontSize: "1.05rem", color: "var(--color-ash, #8c8075)", maxWidth: "520px", lineHeight: 1.65, margin: 0 }}>
            Every artwork you share opens differently. You decide what kind of engagement
            you want — per work, per moment, per state of readiness.
          </p>
        </div>

        <div className="action-preview-grid">

          {/* ── Left: artwork card ── */}
          <div className="ap-card">

            {/* artwork image placeholder */}
            <div className="ap-img">
              <div className="ap-img-inner">
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.25, display: "block", margin: "0 auto 8px" }}>
                  <rect x="6" y="10" width="36" height="28" rx="2" stroke="rgba(245,240,232,0.6)" strokeWidth="1"/>
                  <circle cx="16" cy="20" r="4" stroke="rgba(245,240,232,0.6)" strokeWidth="1"/>
                  <path d="M6 30 L16 22 L24 28 L32 20 L42 30" stroke="rgba(245,240,232,0.6)" strokeWidth="1" strokeLinejoin="round"/>
                </svg>
                <span className="ap-img-label">Your artwork here</span>
              </div>
            </div>

            {/* artwork meta */}
            <div className="ap-meta">
              <div className="ap-title">King in blue</div>
              <div className="ap-artist">Rafael Sava</div>
              <div className="ap-medium">Acrylic on canvas · 80×60 cm · 2024</div>
            </div>

            {/* action rows */}
            <div className="ap-actions">
              <p className="ap-actions-label">Actions open for this work</p>
              {ACTIONS.map((action) => (
                <div className="ap-action-row" key={action.id}>
                  <div className="ap-action-icon">{action.icon}</div>
                  <div className="ap-action-info">
                    <div className="ap-action-name">{action.name}</div>
                    <div className="ap-action-desc">{action.desc}</div>
                  </div>
                  <TierBadge tier={action.tier} tierLabel={action.tierLabel} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: pull quote + tier guide + CTA ── */}
          <div className="ap-right">

            {/* pull quote */}
            <blockquote className="ap-pull">
              <p>"The rarest thing you can give another artist is not money, not exposure — it is your full, considered attention."</p>
              <cite>— Axia founding principle</cite>
            </blockquote>

            {/* tier guide */}
            <div className="ap-tier-guide">
              <p className="ap-tier-guide-label">Who can do what</p>
              {TIER_GUIDE.map((row) => (
                <div className="ap-tier-row" key={row.tier}>
                  <TierBadge tier={row.tier} tierLabel={row.tierLabel} />
                  <p className="ap-tier-desc">{row.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA strip */}
            <div className="ap-cta-strip">
              <p>Founder membership is open now, for a limited time. The first cohort shapes everything that follows.</p>
              <button className="ap-cta-btn" onClick={() => setPage("auth")}>
                Learn about the founders campaign →
              </button>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   HOMEPAGE
═══════════════════════════════════════════════ */
export default function HomePage({ setPage }) {
  const [heroArtworks, setHeroArtworks] = useState([]);
  const [artists, setArtists]           = useState(MOCK_ARTISTS);

  useEffect(() => {
    getDoc(doc(db, "settings", "homepage")).then((snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.heroSnapshots?.length)   setHeroArtworks(data.heroSnapshots);
      if (data.artistSnapshots?.length) setArtists(data.artistSnapshots);
    }).catch(() => {});
  }, []);

  const heroTiles = heroArtworks.length ? heroArtworks : HERO_FALLBACK;

  return (
    <div className="axia-home">

      {/* ── TOP BAR ── */}
      <header className="topbar">
        <div className="logo">
          <svg width="260" height="38" viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
            <text x="104" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" textAnchor="end" fill="#f7f5f0">AXIA</text>
            <g transform="translate(118,10)">
              <line x1="0"  y1="6.5" x2="16"  y2="6.5"  stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="6.5" x2="11.5" y2="11"  stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="16"  x2="0"   y2="16"   stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="0"  y1="16"  x2="4.5" y2="11.5" stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
            </g>
            <text x="148" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" fill="#f7f5f0">ART</text>
          </svg>
        </div>
        <nav className="topbar-nav" aria-label="Primary" style={{ display: "flex", gap: "2rem" }}>
          <a href="#manifesto">Manifesto</a>
          <a href="#how-it-works">How it works</a>
          {/* UPDATED: "Founding cohort" → "Founders campaign" */}
          <a href="#founders-campaign">Founders campaign</a>
        </nav>
        {/* UPDATED: "Join the waitlist" → "Become a founder" */}
        <a className="join" onClick={() => setPage("auth")} style={{ cursor: "pointer" }}>
          Become a founder
        </a>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-left">
          {/* UPDATED eyebrow */}
          <div className="eyebrow">
            <span className="dot" />
            Founders campaign open · Limited seats
          </div>

          {/* UPDATED headline */}
          <h1 className="headline">
            The real value of<br />art <em>art</em>
          </h1>

          {/* UPDATED lede */}
          <p className="lede">
            Not as a market. Not as a career ladder. As the force it actually is —
            the thing that has always been at the centre of every human revolution
            worth remembering.
          </p>
          <p className="lede" style={{ marginTop: "1rem" }}>
            A membership for artists who want to be seen, challenged,
            and changed by each other.
          </p>

          {/* UPDATED CTAs */}
          <div className="hero-ctas">
            <a className="btn btn-primary" onClick={() => setPage("auth")} style={{ cursor: "pointer" }}>
              Become a founder →
            </a>
            <a className="btn btn-ghost" href="#manifesto">Read the manifesto</a>
          </div>

          <div className="waitlist-meta">
            <span>On the waitlist</span>
            <span className="count">◇ 248 artists</span>
            <span>· 61 collectors</span>
          </div>
        </div>

        <div className="hero-right">
          <div className="art-grid">
            {heroTiles.map((art, i) => (
              <figure className="art-tile" key={art.id || i}>
                {art.imageUrl
                  ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  : <div className={`art-ph ${art.ph || PH_CLASSES[i % 4]}`}><span>{art.title?.toUpperCase()}</span></div>
                }
                <figcaption>
                  <span className="ttl">{art.title}</span>
                  <span className="who">{art.artist}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── VALUES BAR — UPDATED: stats → commitments ── */}
      <div className="values">
        <div className="val"><span className="k">No selling</span><span className="v">ever</span></div>
        <div className="val"><span className="k">No galleries</span><span className="v">no intermediaries</span></div>
        <div className="val"><span className="k">No price tags</span><span className="v">only resonance</span></div>
        <div className="val"><span className="k">No noise</span><span className="v">only signal</span></div>
      </div>

      {/* ── ACTION SYSTEM PREVIEW — replaces "Available for exchange" ── */}
      <ActionPreview setPage={setPage} />

      {/* ── MANIFESTO ── */}
      <ManifestoGrid />

      {/* ── FOUR MOVES — UPDATED: full action system ── */}
      <section className="moves" id="how-it-works">
        {/* UPDATED title + lede */}
        <h2>Four ways to be in conversation.</h2>
        <div className="lede">Each artwork you share opens a door. You choose what comes through it.</div>
        <div className="moves-grid">
          <div className="mv-step">
            <div className="num">01</div>
            <div className="icon">◎</div>
            {/* UPDATED */}
            <h4>Send resonance</h4>
            <p>More than a like — a signal that this work moved you. Resonance accumulates into a score that means something, because it comes from people who chose to give it.</p>
          </div>
          <div className="mv-step">
            <div className="num">02</div>
            <div className="icon">◌</div>
            {/* UPDATED */}
            <h4>Open a response</h4>
            <p>Invite written reactions from the community. Not critique — response. What did this work make you feel, remember, imagine? The artist can close this at any time.</p>
          </div>
          <div className="mv-step">
            <div className="num">03</div>
            <div className="icon">◈</div>
            {/* UPDATED */}
            <h4>Start a dialogue</h4>
            <p>Peer to peer, private, structured. Invite specific members into a real conversation about the work. The kind of exchange that used to require knowing the right people.</p>
          </div>
          <div className="mv-step">
            <div className="num">04</div>
            <div className="icon">⇄</div>
            {/* UPDATED — Exchange is now the climax */}
            <h4>Propose an exchange</h4>
            <p>The most radical move. Offer one of your works for theirs. No money. No galleries. Two artists recognising each other's vision and choosing to live with it.</p>
          </div>
        </div>
      </section>

      {/* ── FOUNDER'S LETTER — unchanged, it's already perfect ── */}
      <section className="block">
        <div className="letter">
          <div className="lhs">
            <div className="seal">A</div>
            <div className="label">◇ Letter from the founder</div>
            <h3>Why we're starting small, on purpose.</h3>
          </div>
          <div className="rhs">
            <p>I'm building Axia because I'm tired of watching artists hand half their income to galleries, and watching collectors pretend art is an asset class.</p>
            <p>For now, it's just <em>me and my studio.</em> The works you'd see here are mine. I'd rather show you an honest empty room than fake a crowd.</p>
            <p>If the idea resonates, join the waitlist. When we open, we'll let in <em>thirty artists</em> as a founding cohort. Small, deliberate, real.</p>
            <div className="sign">— Rafael</div>
            <div className="sign-name">Rafael Sava · Founder, Axia Art</div>
          </div>
        </div>
      </section>

      {/* ── ARTISTS ON AXIA — unchanged ── */}
      <section className="block">
        <div className="sec-panel">
          <div className="sec-head">
            <div><h2>Artists on Axia</h2></div>
            <a className="link">Meet all artists →</a>
          </div>
          <div className="artists-row">
            {artists.map((a) => (
              <div className="ar-card" key={a.uid}>
                <div className="ar-tile" style={a.profileImageUrl ? { padding: 0, overflow: "hidden" } : {}}>
                  {a.profileImageUrl
                    ? <img src={a.profileImageUrl} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : initials(a.name)
                  }
                </div>
                <div className="ar-meta">
                  <h4>{a.name}</h4>
                  <span className="loc">{a.location}</span>
                  <span className="cnt">{a.artworkCount} works listed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WAITLIST CTA — UPDATED: founders campaign ── */}
      <section className="waitlist-cta" id="founders-campaign">
        {/* UPDATED eyebrow */}
        <div className="eb">◇ Founders campaign · Limited seats · Applications open</div>

        {/* UPDATED headline */}
        <h2>Become a <em>founder.</em></h2>

        {/* UPDATED body copy */}
        <div className="p">
          The first people to join Axia won't just be members — they'll be part of what it becomes.
          Founders shape the community, influence what gets built, and hold a stake in what this grows into.
        </div>
        <div className="p" style={{ marginTop: "0.75rem" }}>
          If you believe art deserves better infrastructure than it's ever had,
          this is where you start building it.
        </div>
        <div className="p" style={{ marginTop: "0.75rem", fontStyle: "italic", opacity: 0.7 }}>
          One letter. One invitation. No noise before that.
        </div>

        <WaitlistForm />
      </section>

      {/* ── FOOTER — UPDATED tagline ── */}
      <footer className="site-footer">
        <div className="logo">
          <svg width="260" height="38" viewBox="0 0 260 38" xmlns="http://www.w3.org/2000/svg">
            <text x="104" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" textAnchor="end" fill="#f7f5f0">AXIA</text>
            <g transform="translate(118,10)">
              <line x1="0"  y1="6.5" x2="16"  y2="6.5"  stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="6.5" x2="11.5" y2="11"  stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="16" y1="16"  x2="0"   y2="16"   stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
              <line x1="0"  y1="16"  x2="4.5" y2="11.5" stroke="#b8953a" strokeWidth="1" strokeLinecap="round"/>
            </g>
            <text x="148" y="28" fontFamily="'Cormorant Garamond',serif" fontSize="26" fontWeight="400" letterSpacing="6" fill="#f7f5f0">ART</text>
          </svg>
        </div>
        {/* UPDATED tagline */}
        <div className="fmid">The platform that takes art seriously · Built by artists, for the work itself</div>
        <div className="fnav">
          <a>About</a>
          <a>Privacy</a>
          <a>Terms</a>
          <a>Contact</a>
        </div>
      </footer>

    </div>
  );
}
