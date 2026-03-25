import { useState, useRef, useEffect, useCallback } from "react";

const MOCK_ARTWORKS = [
  { id: 1, title: "Golden Hour Study", artist: "Sofia Kwan", location: "Seoul, KR", medium: "Watercolor", size: "40x40cm", year: 2024, color1: "#c9952d", color2: "#c94b2d", shape: "lines" },
  { id: 2, title: "Descent", artist: "Elton Marsh", location: "Lagos, NG", medium: "Acrylic", size: "50x70cm", year: 2023, color1: "#1a1a2e", color2: "#c94b2d", shape: "triangle" },
  { id: 3, title: "Verdant No. 3", artist: "Mina Vasquez", location: "Mexico City, MX", medium: "Oil on canvas", size: "60x80cm", year: 2024, color1: "#2d4a3e", color2: "#8fa58a", shape: "blocks" },
  { id: 4, title: "Liminal Space I", artist: "Yuki Tanaka", location: "Osaka, JP", medium: "Photography", size: "30x45cm", year: 2023, color1: "#3a3a5c", color2: "#7a7aac", shape: "circle" },
  { id: 5, title: "Red Frequency", artist: "Amara Diallo", location: "Paris, FR", medium: "Screenprint", size: "50x70cm", year: 2024, color1: "#8b1a1a", color2: "#d4522a", shape: "grid" },
  { id: 6, title: "Still Waters", artist: "Noa Ben-David", location: "Tel Aviv, IL", medium: "Gouache", size: "25x35cm", year: 2022, color1: "#1a3a4a", color2: "#4a8aaa", shape: "waves" },
];

function ArtSVG({ artwork, width = 300, height = 240 }) {
  const { color1, color2, shape, id } = artwork;
  const uid = `g${id}${width}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${uid})`} />
      {shape === "lines" && [60,100,150,200,240].map((x,i) => (
        <rect key={i} x={x} y={10} width={4} height={height-20} fill="rgba(255,255,255,0.15)" />
      ))}
      {shape === "triangle" && <>
        <polygon points={`${width/2},20 ${width-20},${height-20} 20,${height-20}`} fill="rgba(255,255,255,0.08)" />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.3} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
      </>}
      {shape === "blocks" && [[30,30,80,height*0.5],[130,50,100,80],[150,80,60,80]].map(([x,y,w,h],i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill="rgba(255,255,255,0.08)" rx={1} />
      ))}
      {shape === "circle" && <>
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.38} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.22} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
        <circle cx={width/2} cy={height/2} r={Math.min(width,height)*0.1} fill="rgba(255,255,255,0.08)" />
      </>}
      {shape === "grid" && Array.from({length:4}).flatMap((_,i) => Array.from({length:3}).map((_,j) => (
        <rect key={`${i}-${j}`} x={20+i*70} y={20+j*70} width={55} height={55} fill="rgba(255,255,255,0.06)" rx={2} />
      )))}
      {shape === "waves" && [0,1,2,3].map(i => (
        <path key={i} d={`M0,${height*0.3+i*35} Q${width/4},${height*0.2+i*35} ${width/2},${height*0.3+i*35} T${width},${height*0.3+i*35}`}
          fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}

const S = {
  body: { fontFamily: "'DM Mono', monospace", background: "#f5f0e8", color: "#0d0d0d", minHeight: "100vh" },
  nav: { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", background: "rgba(245,240,232,0.9)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(0,0,0,0.08)" },
  logo: { background: "none", border: "none", cursor: "pointer", fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0d0d0d" },
};

function Nav({ page, setPage, user, setUser }) {
  return (
    <nav style={S.nav}>
      <button onClick={() => setPage("home")} style={S.logo}>
        ART<span style={{ color: "#c94b2d", fontStyle: "italic" }}>x</span>ART
      </button>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        {user ? (<>
          {[["Discover","swipe"],["My Gallery","gallery"],["Matches","matches"]].map(([label, p]) => (
            <button key={p} onClick={() => setPage(p)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: page === p ? "#c94b2d" : "#0d0d0d", opacity: page === p ? 1 : 0.55, borderBottom: page === p ? "1px solid #c94b2d" : "1px solid transparent", paddingBottom: 2 }}>{label}</button>
          ))}
          <button onClick={() => setPage("profile")} style={{ width: 34, height: 34, borderRadius: "50%", background: "#c94b2d", color: "white", border: "none", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>{user.name[0].toUpperCase()}</button>
        </>) : (
          <button onClick={() => setPage("auth")} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "10px 22px", border: "none", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Join / Sign In</button>
        )}
      </div>
    </nav>
  );
}

function Field({ label, name, value, onChange, type = "text", placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginBottom: 5 }}>{label}</label>
      <input name={name} value={value} onChange={onChange} type={type} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${focused ? "#c94b2d" : "rgba(0,0,0,0.13)"}`, background: "#f5f0e8", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Mono',monospace", transition: "border-color 0.2s" }} />
    </div>
  );
}

function FieldArea({ label, name, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginBottom: 5 }}>{label}</label>
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", padding: "11px 13px", border: `1.5px solid ${focused ? "#c94b2d" : "rgba(0,0,0,0.13)"}`, background: "#f5f0e8", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Mono',monospace", resize: "vertical", transition: "border-color 0.2s" }} />
    </div>
  );
}

function AuthPage({ setUser, setPage }) {
  const [mode, setMode] = useState("signup");
  const [form, setForm] = useState({ name: "", email: "", password: "", bio: "", location: "" });
  const [error, setError] = useState("");
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = () => {
    if (!form.email || !form.password) { setError("Email and password required."); return; }
    if (mode === "signup" && !form.name) { setError("Name required."); return; }
    setError("");
    setUser({ name: form.name || form.email.split("@")[0], email: form.email, bio: form.bio || "Artist & collector", location: form.location || "Somewhere beautiful", artworks: [], matches: [], liked: [], passed: [] });
    setPage("gallery");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ width: 420, background: "white", padding: "44px 38px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 900, marginBottom: 6, letterSpacing: "-0.02em" }}>
          {mode === "signup" ? "Join the Exchange" : <span>Welcome <em style={{ color: "#c94b2d" }}>back</em></span>}
        </h2>
        <p style={{ fontSize: "0.7rem", color: "#9e9589", marginBottom: 32, lineHeight: 1.7 }}>
          {mode === "signup" ? "Create your artist account and start trading." : "Sign in to continue your swaps."}
        </p>
        {mode === "signup" && <Field label="Your Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Sofia Kwan" />}
        <Field label="Email *" name="email" value={form.email} onChange={handle} type="email" placeholder="you@example.com" />
        <Field label="Password *" name="password" value={form.password} onChange={handle} type="password" placeholder="••••••••" />
        {mode === "signup" && <>
          <Field label="Location" name="location" value={form.location} onChange={handle} placeholder="City, Country" />
          <FieldArea label="Short Bio" name="bio" value={form.bio} onChange={handle} placeholder="Tell other artists who you are..." />
        </>}
        {error && <p style={{ fontSize: "0.68rem", color: "#c94b2d", marginBottom: 14 }}>{error}</p>}
        <button onClick={submit} style={{ width: "100%", background: "#0d0d0d", color: "#f5f0e8", padding: "14px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16, transition: "background 0.2s" }}
          onMouseOver={e => e.target.style.background = "#c94b2d"} onMouseOut={e => e.target.style.background = "#0d0d0d"}>
          {mode === "signup" ? "Create Account" : "Sign In"} →
        </button>
        <button onClick={() => setMode(m => m === "signup" ? "login" : "signup")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "#9e9589", textDecoration: "underline", width: "100%" }}>
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

function GalleryPage({ user, setUser }) {
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", medium: "", size: "", year: String(new Date().getFullYear()), description: "", imageUrl: null });
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => { setPreview(e.target.result); setForm(f => ({ ...f, imageUrl: e.target.result })); };
    reader.readAsDataURL(file);
  };

  const submitArtwork = () => {
    if (!form.title || !form.medium) return;
    const colors = [["#c9952d","#c94b2d"],["#1a1a2e","#7a7aac"],["#2d4a3e","#8fa58a"],["#3a3a5c","#c94b2d"],["#1a3a4a","#4a8aaa"]];
    const [c1,c2] = colors[Math.floor(Math.random()*colors.length)];
    const shapes = ["lines","triangle","blocks","circle","grid","waves"];
    setUser(u => ({ ...u, artworks: [...(u.artworks||[]), { id: Date.now(), title: form.title, artist: u.name, location: u.location, medium: form.medium, size: form.size||"Unknown size", year: parseInt(form.year)||2024, description: form.description, imageUrl: form.imageUrl, color1: c1, color2: c2, shape: shapes[Math.floor(Math.random()*shapes.length)], likes: 0 }] }));
    setForm({ title:"", medium:"", size:"", year: String(new Date().getFullYear()), description:"", imageUrl:null });
    setPreview(null);
    setShowUpload(false);
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 60px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 44 }}>
        <div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 8 }}>My Gallery</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
            {user.name}'s <em style={{ color: "#c94b2d" }}>Collection</em>
          </h1>
        </div>
        <button onClick={() => setShowUpload(true)} style={{ background: "#c94b2d", color: "white", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}
          onMouseOver={e => e.target.style.background = "#e8613e"} onMouseOut={e => e.target.style.background = "#c94b2d"}>
          + Upload Artwork
        </button>
      </div>

      {(user.artworks||[]).length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9e9589" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎨</div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontStyle: "italic", marginBottom: 10 }}>Your gallery is empty</p>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.8, marginBottom: 24 }}>Upload your first artwork to start trading with artists around the world.</p>
          <button onClick={() => setShowUpload(true)} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "13px 28px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Upload Your First Piece</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 20 }}>
          {(user.artworks||[]).map(art => (
            <div key={art.id} style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.3s, box-shadow 0.3s" }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}>
              <div style={{ height: 190, overflow: "hidden" }}>
                {art.imageUrl ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={art} width={300} height={190} />}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "#5a7a5e", marginBottom: 4 }}>● Available for Trade</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.98rem", fontWeight: 700, marginBottom: 4 }}>{art.title}</div>
                <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{art.medium} · {art.size} · {art.year}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
          <div style={{ background: "#f5f0e8", width: 560, maxHeight: "90vh", overflowY: "auto", padding: "44px 38px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 900 }}>Add Artwork</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9e9589" }}>✕</button>
            </div>

            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
              style={{ width: "100%", height: 210, border: `2px dashed ${dragOver ? "#c94b2d" : "rgba(0,0,0,0.18)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 24, background: dragOver ? "rgba(201,75,45,0.04)" : "transparent", position: "relative", overflow: "hidden", transition: "border-color 0.2s, background 0.2s" }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <>
                  <div style={{ fontSize: "2rem", marginBottom: 10 }}>🖼</div>
                  <div style={{ fontSize: "0.73rem", color: "#9e9589", textAlign: "center", lineHeight: 1.7 }}>Drag & drop your artwork image<br /><span style={{ color: "#c94b2d", textDecoration: "underline" }}>or click to browse</span></div>
                  <div style={{ fontSize: "0.62rem", color: "#9e9589", marginTop: 6 }}>JPG, PNG, WEBP</div>
                </>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}><Field label="Title *" name="title" value={form.title} onChange={handle} placeholder="Name your work" /></div>
              <Field label="Medium *" name="medium" value={form.medium} onChange={handle} placeholder="Oil on canvas..." />
              <Field label="Size" name="size" value={form.size} onChange={handle} placeholder="40x60cm" />
              <Field label="Year" name="year" value={form.year} onChange={handle} placeholder="2024" />
              <div style={{ gridColumn: "1/-1" }}><FieldArea label="Description" name="description" value={form.description} onChange={handle} placeholder="Tell the story behind this piece..." /></div>
            </div>

            <button onClick={submitArtwork} style={{ width: "100%", background: "#0d0d0d", color: "#f5f0e8", padding: "15px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, transition: "background 0.2s" }}
              onMouseOver={e => e.target.style.background = "#c94b2d"} onMouseOut={e => e.target.style.background = "#0d0d0d"}>
              Add to Gallery →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SwipePage({ user, setUser, setPage }) {
  const [deck, setDeck] = useState(() => MOCK_ARTWORKS.filter(a => !(user.liked||[]).includes(a.id) && !(user.passed||[]).includes(a.id)));
  const [animDir, setAnimDir] = useState(null);
  const [matchArt, setMatchArt] = useState(null);
  const cardRef = useRef();
  const labelWantRef = useRef();
  const labelPassRef = useRef();
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0 });

  const doSwipe = useCallback((dir) => {
    if (!deck[0]) return;
    const art = deck[0];
    const isMatch = dir === "right" && Math.random() > 0.35;
    setAnimDir(dir);
    setUser(u => ({
      ...u,
      liked: dir === "right" ? [...(u.liked||[]), art.id] : u.liked,
      passed: dir === "left" ? [...(u.passed||[]), art.id] : u.passed,
      matches: isMatch ? [...(u.matches||[]), art] : u.matches
    }));
    setTimeout(() => {
      setDeck(d => d.slice(1));
      setAnimDir(null);
      if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
      if (isMatch) setMatchArt(art);
    }, 500);
  }, [deck, setUser]);

  const onStart = e => {
    const pt = e.touches ? e.touches[0] : e;
    drag.current = { active: true, startX: pt.clientX, startY: pt.clientY, dx: 0 };
  };

  const onMove = useCallback(e => {
    if (!drag.current.active || !cardRef.current) return;
    if (e.cancelable) e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - drag.current.startX;
    const dy = pt.clientY - drag.current.startY;
    drag.current.dx = dx;
    cardRef.current.style.transform = `translateX(${dx}px) translateY(${dy*0.2}px) rotate(${dx*0.07}deg)`;
    if (labelWantRef.current) labelWantRef.current.style.opacity = dx > 30 ? Math.min(1,(dx-30)/80) : 0;
    if (labelPassRef.current) labelPassRef.current.style.opacity = dx < -30 ? Math.min(1,(-dx-30)/80) : 0;
  }, []);

  const onEnd = useCallback(() => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (labelWantRef.current) labelWantRef.current.style.opacity = 0;
    if (labelPassRef.current) labelPassRef.current.style.opacity = 0;
    if (drag.current.dx > 80) doSwipe("right");
    else if (drag.current.dx < -80) doSwipe("left");
    else if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
  }, [doSwipe]);

  useEffect(() => {
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchend", onEnd);
    };
  }, [onMove, onEnd]);

  if (deck.length === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>✦</div>
      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontStyle: "italic", marginBottom: 12 }}>You've seen everything</p>
      <p style={{ fontSize: "0.73rem", color: "#9e9589", marginBottom: 24 }}>Check back soon for new artworks</p>
      <button onClick={() => setPage("matches")} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>See Your Matches</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80, padding: "96px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#9e9589", marginBottom: 8 }}>Discover</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Swipe to <em style={{ color: "#c94b2d" }}>collect</em>
        </h2>
      </div>

      <div style={{ position: "relative", width: 320, height: 450, marginBottom: 28 }}>
        {deck.slice(0,3).reverse().map((art, ri) => {
          const isTop = ri === Math.min(deck.length,3) - 1;
          const offset = Math.min(deck.length,3) - 1 - ri;
          const rotations = [-1, 3, -5];
          return (
            <div key={art.id} ref={isTop ? cardRef : null}
              onMouseDown={isTop ? onStart : undefined}
              onTouchStart={isTop ? onStart : undefined}
              style={{
                position: "absolute", inset: 0, background: "white",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden", cursor: isTop ? "grab" : "default",
                transform: animDir && isTop
                  ? `translateX(${animDir === "right" ? 150 : -150}%) rotate(${animDir === "right" ? 22 : -22}deg)`
                  : `rotate(${rotations[offset]}deg) translateY(${offset * 10}px)`,
                zIndex: isTop ? 3 : 2 - offset,
                transition: animDir && isTop ? "transform 0.5s ease" : isTop ? "none" : "transform 0.3s ease",
                opacity: animDir && isTop ? 0 : 1,
                userSelect: "none"
              }}>
              {isTop && <>
                <div ref={labelWantRef} style={{ position: "absolute", top: 20, left: 16, padding: "5px 13px", border: "2px solid #5a7a5e", color: "#5a7a5e", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(-8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)" }}>WANT</div>
                <div ref={labelPassRef} style={{ position: "absolute", top: 20, right: 16, padding: "5px 13px", border: "2px solid #c94b2d", color: "#c94b2d", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)" }}>PASS</div>
              </>}
              <div style={{ height: 295, overflow: "hidden", pointerEvents: "none" }}>
                {art.imageUrl ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={art} width={320} height={295} />}
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "#9e9589", marginBottom: 4 }}>{art.artist} — {art.location}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>{art.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.6rem", color: "#9e9589" }}>{art.medium} · {art.size}</span>
                  <span style={{ fontSize: "0.6rem", color: "#9e9589" }}>{art.year}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
        {[["✕","#c94b2d","Pass","left",58],["+","#9e9589","Info",null,44],["♡","#5a7a5e","Want","right",58]].map(([icon,color,title,dir,size]) => (
          <button key={title} onClick={() => dir && doSwipe(dir)} title={title} style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${color}`, background: "white", color, fontSize: size > 50 ? "1.3rem" : "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", transition: "all 0.2s", cursor: "pointer" }}
            onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "white"; e.currentTarget.style.transform = "scale(1.1)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "white"; e.currentTarget.style.color = color; e.currentTarget.style.transform = "scale(1)"; }}>
            {icon}
          </button>
        ))}
      </div>
      <p style={{ marginTop: 20, fontSize: "0.62rem", color: "#9e9589" }}>{deck.length} artwork{deck.length !== 1 ? "s" : ""} remaining</p>

      {matchArt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.92)", zIndex: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "3.2rem", color: "white", fontWeight: 900, fontStyle: "italic", marginBottom: 8 }}>It's a Match</div>
          <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 36 }}>{matchArt.artist} also wants to trade</p>
          <div style={{ display: "flex", gap: 20, marginBottom: 36, alignItems: "center" }}>
            {[user.artworks?.[0], matchArt].map((art, i) => (
              <div key={i} style={{ width: 155, height: 195, background: "white", overflow: "hidden" }}>
                {art?.imageUrl ? <img src={art.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={art || MOCK_ARTWORKS[2]} width={155} height={195} />}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setMatchArt(null); setPage("matches"); }} style={{ background: "#c94b2d", color: "white", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>Start the Conversation</button>
            <button onClick={() => setMatchArt(null)} style={{ background: "transparent", color: "rgba(255,255,255,0.5)", padding: "13px 22px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Keep Browsing</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchesPage({ user }) {
  const matches = user.matches || [];
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const msgsEndRef = useRef();

  const sendMsg = () => {
    if (!input.trim() || !activeChat) return;
    const key = activeChat.id;
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(m => ({ ...m, [key]: [...(m[key]||[]), { from: "me", text: input, time }] }));
    setInput("");
    const replies = [
      "That sounds great! I'd love to make this trade happen.",
      "My piece is ready to ship anytime — what about yours?",
      "I've been hoping someone would want to trade for this one.",
      "Wonderful! Let's sort out the shipping details.",
    ];
    setTimeout(() => {
      const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(m => ({ ...m, [key]: [...(m[key]||[]), { from: "them", text: replies[Math.floor(Math.random()*replies.length)], time: t }] }));
    }, 1000 + Math.random()*800);
  };

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, activeChat]);

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 0 0" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 40px 40px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 8 }}>Mutual Interest</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.5rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Your <em style={{ color: "#c94b2d" }}>Matches</em></h1>
        </div>

        {matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#9e9589" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>⇄</div>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontStyle: "italic", marginBottom: 10 }}>No matches yet</p>
            <p style={{ fontSize: "0.73rem", lineHeight: 1.8 }}>Keep swiping — when another artist wants your work too, you'll both appear here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: activeChat ? "290px 1fr" : "1fr", gap: 2, background: "rgba(0,0,0,0.07)" }}>
            <div style={{ background: "#f5f0e8" }}>
              {matches.map(art => (
                <div key={art.id} onClick={() => setActiveChat(art)} style={{ display: "flex", gap: 14, padding: "18px", cursor: "pointer", background: activeChat?.id === art.id ? "#ede8dc" : "transparent", borderLeft: activeChat?.id === art.id ? "3px solid #c94b2d" : "3px solid transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 56, height: 56, flexShrink: 0, overflow: "hidden" }}>
                    {art.imageUrl ? <img src={art.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={art} width={56} height={56} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.92rem", fontWeight: 700 }}>{art.artist}</div>
                    <div style={{ fontSize: "0.62rem", color: "#9e9589", marginTop: 2 }}>"{art.title}"</div>
                    <div style={{ fontSize: "0.58rem", color: "#5a7a5e", marginTop: 3 }}>✓ Mutual match</div>
                  </div>
                </div>
              ))}
            </div>

            {activeChat && (
              <div style={{ background: "white", display: "flex", flexDirection: "column", height: 500 }}>
                <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, overflow: "hidden", flexShrink: 0 }}>
                    {activeChat.imageUrl ? <img src={activeChat.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={activeChat} width={42} height={42} />}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700 }}>{activeChat.artist}</div>
                    <div style={{ fontSize: "0.6rem", color: "#9e9589" }}>"{activeChat.title}" · {activeChat.medium}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#5a7a5e", background: "rgba(90,122,94,0.1)", padding: "4px 10px" }}>Trade Pending</div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {!(messages[activeChat.id]?.length) && (
                    <div style={{ textAlign: "center", color: "#9e9589", fontSize: "0.7rem", fontStyle: "italic", margin: "auto 0" }}>
                      You matched on "{activeChat.title}".<br />Start the conversation about your trade.
                    </div>
                  )}
                  {(messages[activeChat.id]||[]).map((msg, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "72%", padding: "10px 13px", background: msg.from === "me" ? "#0d0d0d" : "#ede8dc", color: msg.from === "me" ? "#f5f0e8" : "#0d0d0d", fontSize: "0.78rem", lineHeight: 1.6 }}>
                        {msg.text}
                        <div style={{ fontSize: "0.56rem", opacity: 0.5, marginTop: 3, textAlign: "right" }}>{msg.time}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={msgsEndRef} />
                </div>

                <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 10 }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMsg()}
                    placeholder="Propose the terms of your trade..."
                    style={{ flex: 1, padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f5f0e8", fontSize: "0.78rem", outline: "none", fontFamily: "'DM Mono',monospace" }} />
                  <button onClick={sendMsg} style={{ background: "#c94b2d", color: "white", padding: "11px 18px", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.06em" }}>Send</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfilePage({ user, setUser, setPage }) {
  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 60px 60px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 20 }}>Your Profile</div>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 44 }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#c94b2d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 900, flexShrink: 0 }}>{user.name[0].toUpperCase()}</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>{user.name}</h1>
            <div style={{ fontSize: "0.7rem", color: "#9e9589", marginBottom: 8 }}>{user.location}</div>
            <div style={{ fontSize: "0.78rem", lineHeight: 1.7 }}>{user.bio}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: "rgba(0,0,0,0.07)", marginBottom: 44 }}>
          {[["Artworks Listed", user.artworks?.length||0], ["Matches", user.matches?.length||0], ["Trades Made", 0]].map(([l,v]) => (
            <div key={l} style={{ background: "#f5f0e8", padding: "22px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900 }}>{v}</div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
        <button onClick={() => { setUser(null); setPage("home"); }} style={{ background: "transparent", color: "#9e9589", padding: "11px 22px", border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Sign Out</button>
      </div>
    </div>
  );
}

function HomePage({ setPage }) {
  return (
    <div>
      <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", paddingTop: 80 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "80px 56px 80px 72px" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 20 }}>The Art Exchange</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(3.5rem,5vw,5.2rem)", fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.03em", marginBottom: 24 }}>
            Your art<br />for <em style={{ color: "#c94b2d" }}>their</em><br />art.
          </h1>
          <p style={{ fontSize: "0.86rem", lineHeight: 1.8, color: "#9e9589", maxWidth: 370, marginBottom: 36 }}>
            A platform where artists become collectors. Swap your work for theirs. No money. No galleries. Just the pure exchange of creative souls.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setPage("auth")} style={{ background: "#c94b2d", color: "white", padding: "15px 30px", border: "none", cursor: "pointer", fontSize: "0.76rem", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}
              onMouseOver={e => e.target.style.background = "#e8613e"} onMouseOut={e => e.target.style.background = "#c94b2d"}>
              Start Swapping →
            </button>
            <button onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: "#0d0d0d", padding: "15px 22px", border: "1.5px solid #0d0d0d", cursor: "pointer", fontSize: "0.74rem", letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s" }}
              onMouseOver={e => { e.target.style.background = "#0d0d0d"; e.target.style.color = "#f5f0e8"; }}
              onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = "#0d0d0d"; }}>
              How It Works
            </button>
          </div>
        </div>
        <div style={{ background: "#ede8dc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", fontFamily: "'Playfair Display',serif", fontSize: "18vw", fontWeight: 900, color: "rgba(0,0,0,0.04)", pointerEvents: "none", letterSpacing: "-0.03em" }}>SWAP</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, position: "relative", zIndex: 2 }}>
            {MOCK_ARTWORKS.slice(0,4).map((art,i) => (
              <div key={art.id} style={{ width: 148, height: 178, background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.12)", transform: `rotate(${[-2,3,-1,2][i]}deg)`, overflow: "hidden", transition: "transform 0.3s" }}
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

      <div id="how" style={{ padding: "96px 72px" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 14 }}>The Process</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.8rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 56 }}>Four moves.<br />One exchange.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", borderLeft: "1px solid rgba(0,0,0,0.1)" }}>
          {[
            { n:"01", icon:"🖼", title:"List Your Work", desc:"Upload artworks you're willing to trade. Photos, paintings, sculptures, digital — if you made it, it belongs here." },
            { n:"02", icon:"👁", title:"Browse & Swipe", desc:"Swipe right to want, left to pass. When both artists want each other's work, it's a match." },
            { n:"03", icon:"🤝", title:"Negotiate", desc:"Chat directly. Agree on what to swap. No platform fee. No intermediary. Just you and the other artist." },
            { n:"04", icon:"📦", title:"Ship & Collect", desc:"Exchange your pieces. You're now an art collector — chosen by another artist who saw value in yours." },
          ].map(s => (
            <div key={s.n} style={{ padding: "32px 28px", borderRight: "1px solid rgba(0,0,0,0.1)", transition: "background 0.3s" }}
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

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const updateUser = fn => setUser(u => typeof fn === "function" ? fn(u) : fn);

  return (
    <div style={S.body}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&display=swap'); *,*::before,*::after{box-sizing:border-box;margin:0;padding:0} input,textarea,button{font-family:'DM Mono',monospace} body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:9999;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");opacity:0.5}`}</style>
      <Nav page={page} setPage={setPage} user={user} setUser={setUser} />
      {page === "home" && <HomePage setPage={setPage} />}
      {page === "auth" && <AuthPage setUser={setUser} setPage={setPage} />}
      {page === "gallery" && user && <GalleryPage user={user} setUser={updateUser} />}
      {page === "swipe" && user && <SwipePage user={user} setUser={updateUser} setPage={setPage} />}
      {page === "matches" && user && <MatchesPage user={user} />}
      {page === "profile" && user && <ProfilePage user={user} setUser={setUser} setPage={setPage} />}
      {!user && !["home","auth"].includes(page) && <AuthPage setUser={setUser} setPage={setPage} />}
    </div>
  );
}
