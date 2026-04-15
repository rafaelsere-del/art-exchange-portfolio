import { useState, useRef, useEffect, useCallback } from "react";
import { db } from "../firebase";
import { doc, setDoc, getDoc, getDocs, collection } from "firebase/firestore";
import ArtSVG from "../components/ArtSVG";
import { RADIUS } from "../styles/theme";

export default function SwipePage({ user, setUser, setPage }) {
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animDir, setAnimDir] = useState(null);
  const [matchArt, setMatchArt] = useState(null);
  const cardRef = useRef();
  const labelWantRef = useRef();
  const labelPassRef = useRef();
  const drag = useRef({ active: false, startX: 0, startY: 0, dx: 0 });

  // ── Load deck from subcollections ──────────────────────────────────────────
  useEffect(() => {
    const loadDeck = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const allArtworks = [];

        await Promise.all(
          usersSnap.docs
            .filter(d => d.id !== user.uid)
            .map(async d => {
              const ownerData = d.data();
              const artworksSnap = await getDocs(collection(db, "users", d.id, "artworks"));
              artworksSnap.docs.forEach(a => {
                const art = {
                  id: a.id,
                  ownerUid: d.id,
                  ownerName: ownerData.name || "Artist",
                  ownerLocation: ownerData.location || "",
                  ...a.data(),
                };
                if (
                  !(user.liked || []).includes(a.id) &&
                  !(user.passed || []).includes(a.id)
                ) {
                  allArtworks.push(art);
                }
              });
            })
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

  // ── Swipe logic ────────────────────────────────────────────────────────────
  const doSwipe = useCallback(async (dir) => {
    if (!deck[0]) return;
    const art = deck[0];
    setAnimDir(dir);

    if (dir === "right") {
      try {
        const otherUid = art.ownerUid;

        await setDoc(doc(db, "likes", `${user.uid}_${otherUid}`), {
          from: user.uid,
          to: otherUid,
          artworkId: art.id,
          createdAt: new Date()
        });

        const reverseLikeSnap = await getDoc(doc(db, "likes", `${otherUid}_${user.uid}`));
        const isMatch = reverseLikeSnap.exists();

        if (isMatch) {
          const matchId = [user.uid, otherUid].sort().join("_");
          await setDoc(doc(db, "matches", matchId), {
            user1: [user.uid, otherUid].sort()[0],
            user2: [user.uid, otherUid].sort()[1],
            artwork1: {
              title: user.name,
              artist: user.name,
              imageUrl: user.artworkBase64 || null,
            },
            artwork2: {
              title: art.title || art.ownerName,
              artist: art.ownerName,
              imageUrl: art.imageUrl || null,
              color1: art.color1 || "#c9952d",
              color2: art.color2 || "#c94b2d",
              shape: art.shape || "lines",
            },
            matchedAt: new Date()
          });

          setUser(u => ({
            ...u,
            liked: [...(u.liked || []), art.id],
            matches: [...(u.matches || []), {
              id: matchId,
              otherUid,
              title: art.title || art.ownerName,
              artist: art.ownerName,
              location: art.ownerLocation,
              imageUrl: art.imageUrl || null,
              color1: art.color1 || "#c9952d",
              color2: art.color2 || "#c94b2d",
              shape: art.shape || "lines"
            }]
          }));

          setTimeout(() => {
            setDeck(d => d.slice(1));
            setAnimDir(null);
            if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
            setMatchArt(art);
          }, 500);

        } else {
          setUser(u => ({ ...u, liked: [...(u.liked || []), art.id] }));
          setTimeout(() => {
            setDeck(d => d.slice(1));
            setAnimDir(null);
            if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
          }, 500);
        }

      } catch (err) {
        console.error("Error procesando swipe:", err);
        setTimeout(() => { setDeck(d => d.slice(1)); setAnimDir(null); }, 500);
      }

    } else {
      setUser(u => ({ ...u, passed: [...(u.passed || []), art.id] }));
      setTimeout(() => {
        setDeck(d => d.slice(1));
        setAnimDir(null);
        if (cardRef.current) cardRef.current.style.transform = "rotate(-1deg)";
      }, 500);
    }
  }, [deck, setUser, user.uid, user.name, user.artworkBase64]);

  // ── Drag handlers ──────────────────────────────────────────────────────────
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

  // ── States ─────────────────────────────────────────────────────────────────
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#9e9589", marginBottom: 8 }}>Discover</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
          Swipe to <em style={{ color: "#c94b2d" }}>collect</em>
        </h2>
      </div>

      {/* Card stack */}
      <div style={{ position: "relative", width: "90%", maxWidth: 360, marginBottom: 28 }}>
        {deck.slice(0, 3).reverse().map((art, ri) => {
          const isTop = ri === Math.min(deck.length, 3) - 1;
          const offset = Math.min(deck.length, 3) - 1 - ri;
          const rotations = [-1, 3, -5];
          const hasImage = !!art.imageUrl;

          return (
            <div key={art.id}
              ref={isTop ? cardRef : null}
              onMouseDown={isTop ? onStart : undefined}
              onTouchStart={isTop ? onStart : undefined}
              style={{
                position: "relative",
                background: "white",
                boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
                cursor: isTop ? "grab" : "default",
                borderRadius: RADIUS,
                // Stack cards visually — only top card is positioned relative, others absolute behind
                ...(isTop ? {} : {
                  position: "absolute",
                  inset: 0,
                }),
                transform: animDir && isTop
                  ? `translateX(${animDir === "right" ? 150 : -150}%) rotate(${animDir === "right" ? 22 : -22}deg)`
                  : `rotate(${rotations[offset]}deg) translateY(${offset * 10}px)`,
                zIndex: isTop ? 3 : 2 - offset,
                transition: animDir && isTop ? "transform 0.5s ease" : isTop ? "none" : "transform 0.3s ease",
                opacity: animDir && isTop ? 0 : 1,
                userSelect: "none"
              }}>

              {/* WANT / PASS labels */}
              {isTop && <>
                <div ref={labelWantRef} style={{ position: "absolute", top: 20, left: 16, padding: "5px 13px", border: "2px solid #5a7a5e", color: "#5a7a5e", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(-8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)", borderRadius: RADIUS }}>WANT</div>
                <div ref={labelPassRef} style={{ position: "absolute", top: 20, right: 16, padding: "5px 13px", border: "2px solid #c94b2d", color: "#c94b2d", fontSize: "0.7rem", letterSpacing: "0.12em", textTransform: "uppercase", transform: "rotate(8deg)", opacity: 0, zIndex: 10, pointerEvents: "none", background: "rgba(255,255,255,0.92)", borderRadius: RADIUS }}>PASS</div>
              </>}

              {/* Artwork image — correct proportions */}
              <div style={{
                width: "100%",
                // Use natural aspect ratio for real images, fixed height for SVG placeholders
                aspectRatio: hasImage ? "4 / 5" : undefined,
                height: hasImage ? undefined : 295,
                overflow: "hidden",
                pointerEvents: "none",
                background: "#f0ebe0"
              }}>
                {hasImage
                  ? <img
                      src={art.imageUrl}
                      alt={art.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        objectPosition: "center",
                        display: "block"
                      }}
                    />
                  : <ArtSVG artwork={art} width={360} height={295} />
                }
              </div>

              {/* Card info */}
              <div style={{ padding: "16px 18px 20px" }}>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.16em", color: "#9e9589", marginBottom: 5 }}>
                  {art.ownerName}{art.ownerLocation ? ` — ${art.ownerLocation}` : ""}
                </div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.15rem", fontWeight: 700, marginBottom: 5, lineHeight: 1.2 }}>
                  {art.title || "Untitled"}
                </div>
                <div style={{ fontSize: "0.62rem", color: "#9e9589", display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {art.medium && <span>{art.medium}</span>}
                  {art.size && <><span style={{ opacity: 0.4 }}>·</span><span>{art.size}</span></>}
                  {art.year && <><span style={{ opacity: 0.4 }}>·</span><span>{art.year}</span></>}
                  {art.estimatedValue && <><span style={{ opacity: 0.4 }}>·</span><span style={{ color: "#c94b2d" }}>£{art.estimatedValue}</span></>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
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
      <p style={{ marginTop: 20, fontSize: "0.62rem", color: "#9e9589" }}>
        {deck.length} artwork{deck.length !== 1 ? "s" : ""} remaining
      </p>

      {/* Match overlay */}
      {matchArt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(13,13,13,0.92)", zIndex: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "3.2rem", color: "white", fontWeight: 900, fontStyle: "italic", marginBottom: 8 }}>It's a Match</div>
          <p style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 36 }}>
            {matchArt.ownerName} also wants to trade
          </p>
          <div style={{ display: "flex", gap: 20, marginBottom: 36, alignItems: "center" }}>
            {[
              { imageUrl: user.artworkBase64 || null, color1: "#c9952d", color2: "#c94b2d", shape: "lines" },
              matchArt
            ].map((art, i) => (
              <div key={i} style={{ width: 155, height: 195, background: "white", overflow: "hidden", borderRadius: RADIUS }}>
                {art?.imageUrl
                  ? <img src={art.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <ArtSVG artwork={art} width={155} height={195} />
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
