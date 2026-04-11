import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import ArtSVG from "../components/ArtSVG";
import { RADIUS } from "../styles/theme";

const MOCK_ARTWORKS = [
  { id: 1, title: "Golden Hour Study", artist: "Sofia Kwan", color1: "#c9952d", color2: "#c94b2d", shape: "lines" },
  { id: 2, title: "Descent", artist: "Elton Marsh", color1: "#1a1a2e", color2: "#c94b2d", shape: "triangle" },
];

export default function SwipePage({ user, setUser, setPage }) {
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animDir, setAnimDir] = useState(null);
  const [matchArt, setMatchArt] = useState(null);
  const cardRef = useRef();
  const labelWantRef = useRef();
  const labelPassRef = useRef();
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0 });

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const allArtworks = snap.docs
          .map(d => ({ id: d.id, ownerUid: d.id, ...d.data() }))
          .filter(a =>
            a.ownerUid !== user.uid &&
            !(user.liked || []).includes(a.id) &&
            !(user.passed || []).includes(a.id)
          );
        setDeck(allArtworks);
      } catch (err) {
        console.error("Error cargando artworks:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDeck();
  }, [user.uid]);

  const doSwipe = useCallback(async (dir) => {
    if (!deck[0]) return;
    const art = deck[0];
    setAnimDir(dir);

    if (dir === "right") {
      try {
        const otherUid = art.ownerUid;

        // 1. Guardar el like en Firestore
        await setDoc(doc(db, "likes", `${user.uid}_${otherUid}`), {
          from: user.uid,
          to: otherUid,
          createdAt: new Date()
        });

        // 2. Verificar si el otro usuario ya me dio like
        const reverseLikeSnap = await getDoc(doc(db, "likes", `${otherUid}_${user.uid}`));
        const isMatch = reverseLikeSnap.exists();

        if (isMatch) {
          // 3. Crear el match en Firestore
          const matchId = [user.uid, otherUid].sort().join("_");
          await setDoc(doc(db, "matches", matchId), {
            user1: [user.uid, otherUid].sort()[0],
            user2: [user.uid, otherUid].sort()[1],
            artwork1: {
              title: user.name,
              artist: user.name,
              imageUrl: user.artworkBase64 || null,
              artworkBase64: user.artworkBase64 || null,
            },
            artwork2: {
              title: art.name,
              artist: art.name,
              imageUrl: art.artworkBase64 || null,
              artworkBase64: art.artworkBase64 || null,
            },
            matchedAt: new Date()
          });

          setUser(u => ({
            ...u,
            liked: [...(u.liked || []), art.id],
            matches: [...(u.matches || []), {
              id: matchId,
              otherUid,
              title: art.name,
              artist: art.name,
              location: art.location,
              artworkBase64: art.artworkBase64 || null,
              imageUrl: art.artworkBase64 || null,
              color1: "#c9952d",
              color2: "#c94b2d",
              shape: "lines"
            }]
          }));

          setTimeout(() => {
            setDeck(d => d.slice(1));
            setAnimDir(null);
            if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
            setMatchArt(art);
          }, 500);

        } else {
          // Like guardado pero aún no hay match
          setUser(u => ({
            ...u,
            liked: [...(u.liked || []), art.id],
          }));

          setTimeout(() => {
            setDeck(d => d.slice(1));
            setAnimDir(null);
            if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
          }, 500);
        }

      } catch (err) {
        console.error("Error procesando swipe:", err);
        setTimeout(() => {
          setDeck(d => d.slice(1));
          setAnimDir(null);
        }, 500);
      }

    } else {
      // Swipe left — solo pasar
      setUser(u => ({
        ...u,
        passed: [...(u.passed || []), art.id],
      }));

      setTimeout(() => {
        setDeck(d => d.slice(1));
        setAnimDir(null);
        if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
      }, 500);
    }
  }, [deck, setUser, user.uid, user.name, user.artworkBase64]);

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
    cardRef.current.style.transform = `translateX(${dx}px) translateY(${dy * 0.2}px) rotate(${dx * 0.07}deg)`;
    if (labelWantRef.current) labelWantRef.current.style.opacity = dx > 30 ? Math.min(1, (dx - 30) / 80) : 0;
    if (labelPassRef.current) labelPassRef.current.style.opacity = dx < -30 ? Math.min(1, (-dx - 30) / 80) : 0;
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

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "2rem", marginBottom: 16 }}>✦</div>
      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", fontStyle: "italic", color: "#9e9589" }}>Loading artworks...</p>
    </div>
  );

  if (deck.length === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
      <div style={{ fontSize: "3rem", marginBottom: 16 }}>✦</div>
      <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontStyle: "italic", marginBottom: 12 }}>You've seen everything</p>
      <p style={{ fontSize: "0.73rem", color: "#9e9589", marginBottom: 24 }}>Check back soon for new artworks</p>
      <button onClick={() => setPage("matches")} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: RADIUS }}>
        See Your Matches
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#9e9589", marginBottom: 8 }}>Discover</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Swipe to <em style={{ color: "#c94b2d" }}>collect</em>
        </h2>
      </div>

      <div style={{ position: "relative", width: "90%", maxWidth: 350, height: "60vh", marginBottom: 28 }}>
        {deck.slice(0, 3).reverse().map((art, ri) => {
          const isTop = ri === Math.min(deck.length, 3) - 1;
          const offset = Math.min(deck.length, 3) - 1 - ri;
          const rotations = [-1, 3, -5];
          return (
            <div key={art.id} ref={isTop ? cardRef : null}
              onMouseDown={isTop ? onStart : undefined}
              onTouchStart={isTop ? onStart : undefined}
              style={{
                position: "absolute", inset: 0, background: "white",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden", cursor: isTop ? "grab" : "default",
                borderRadius: RADIUS,
                transform: animDir && isTop
                  ? `translateX(${animDir === "right" ? 150 : -150}%) rotate(${animDir === "right" ? 22 : -22}deg)`
                  : `rotate(${rotations[offset]}deg) translateY(${offset * 10}px)`,
                zIndex: isTop ? 3 : 2 - offset,
                transition: animDir && isTop ? "transform 0.5s ease" : isTop ? "none" : "transform 0.3s ease",
                opacity: animDir && isTop ? 0 : 1,
                userSelect: "none"
              }}>
              {isTop && <>
                <div ref={labelWantRef} style={{ position: "absolute", top: 20, left: 16, padding: "5px 13px", border: "2px solid #5a7a5e", color: "#5a7a5e", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(-8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)", borderRadius: RADIUS }}>WANT</div>
                <div ref={labelPassRef} style={{ position: "absolute", top: 20, right: 16, padding: "5px 13px", border: "2px solid #c94b2d", color: "#c94b2d", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)", borderRadius: RADIUS }}>PASS</div>
              </>}
              <div style={{ height: 295, overflow: "hidden", pointerEvents: "none" }}>
                {art.artworkBase64
                  ? <img src={art.artworkBase64} alt={art.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <ArtSVG artwork={art} width={320} height={295} />
                }
              </div>
              <div style={{ padding: "14px 18px" }}>
                <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "#9e9589", marginBottom: 4 }}>{art.name} — {art.location}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 6 }}>
                  {art.artworkFile?.replace(/_/g, " ").replace(".jpg", "") || art.name}
                </div>
                <div style={{ fontSize: "0.6rem", color: "#9e9589" }}>{art.bio?.slice(0, 80)}...</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
        {[["✕", "#c94b2d", "Pass", "left", 58], ["+", "#9e9589", "Info", null, 44], ["♡", "#5a7a5e", "Want", "right", 58]].map(([icon, color, title, dir, size]) => (
          <button key={title} onClick={() => dir && doSwipe(dir)} title={title}
            style={{ width: size, height: size, borderRadius: "50%", border: `1.5px solid ${color}`, background: "white", color, fontSize: size > 50 ? "1.3rem" : "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", transition: "all 0.2s", cursor: "pointer" }}
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
          <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 36 }}>
            {matchArt.name} also wants to trade
          </p>
          <div style={{ display: "flex", gap: 20, marginBottom: 36, alignItems: "center" }}>
            {[{ artworkBase64: user.artworkBase64 }, matchArt].map((art, i) => (
              <div key={i} style={{ width: 155, height: 195, background: "white", overflow: "hidden", borderRadius: RADIUS }}>
                {art?.artworkBase64
                  ? <img src={art.artworkBase64} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <ArtSVG artwork={art || MOCK_ARTWORKS[i]} width={155} height={195} />
                }
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => { setMatchArt(null); setPage("matches"); }}
              style={{ background: "#c94b2d", color: "white", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: RADIUS }}>
              Start the Conversation
            </button>
            <button onClick={() => setMatchArt(null)}
              style={{ background: "transparent", color: "rgba(255,255,255,0.5)", padding: "13px 22px", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: RADIUS }}>
              Keep Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
