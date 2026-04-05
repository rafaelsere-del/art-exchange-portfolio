import { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import { Field, FieldArea } from "../components/Fields";
import { btnPrimary, btnAccent, btnOutline } from "../styles/theme";

export default function AuthPage({ setUser }) {
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", bio: "", location: "" });
  const [error, setError] = useState("");
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const reset = (newMode) => {
    setForm({ name: "", email: "", password: "", bio: "", location: "" });
    setError("");
    setMode(newMode);
  };

  const submit = async () => {
    if (!form.email || !form.password) { setError("Email and password required."); return; }
    if (mode === "signup" && !form.name) { setError("Name required."); return; }
    setError("");

    if (mode === "signup") {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
        const firebaseUser = userCredential.user;
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: form.name, email: form.email,
          bio: form.bio || "Artist & collector",
          location: form.location || "Somewhere beautiful",
          createdAt: new Date()
        });
        setUser({
          uid: firebaseUser.uid, name: form.name, email: form.email,
          bio: form.bio || "Artist & collector",
          location: form.location || "Somewhere beautiful",
          artworks: [], matches: [], liked: [], passed: []
        });
      } catch (err) {
        setError("Error: " + err.message);
      }
    } else {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
        const firebaseUser = userCredential.user;

        const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};

        const artworksSnap = await getDocs(collection(db, "users", firebaseUser.uid, "artworks"));
        const artworks = artworksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const allMatchesSnap = await getDocs(collection(db, "matches"));
        const matches = allMatchesSnap.docs
          .filter(d => d.id.includes(firebaseUser.uid))
          .map(d => {
            const data = d.data();
            const isUser1 = data.user1 === firebaseUser.uid;
            const otherArtwork = isUser1 ? data.artwork2 : data.artwork1;
            return {
              id: d.id,
              otherUid: isUser1 ? data.user2 : data.user1,
              title: otherArtwork?.title || "Artwork",
              artist: otherArtwork?.artist || "Artist",
              imageUrl: otherArtwork?.imageUrl || null,
              color1: otherArtwork?.color1 || "#c9952d",
              color2: otherArtwork?.color2 || "#c94b2d",
              shape: otherArtwork?.shape || "lines",
            };
          });

        setUser({
          uid: firebaseUser.uid,
          name: profile.name || firebaseUser.displayName || form.email.split("@")[0],
          email: firebaseUser.email,
          bio: profile.bio || "Artist & collector",
          location: profile.location || "Somewhere beautiful",
          artworks, matches, liked: [], passed: []
        });
      } catch (err) {
        setError("Error: " + err.message);
      }
    }
  };

  if (mode === null) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <div style={{ width: 420, textAlign: "center" }}>
        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 16 }}>Welcome</div>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.4rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 12 }}>
          The Art <em style={{ color: "#c94b2d" }}>Exchange</em>
        </h2>
        <p style={{ fontSize: "0.75rem", color: "#9e9589", lineHeight: 1.8, marginBottom: 44, maxWidth: 320, margin: "0 auto 44px" }}>
          Trade your artwork directly with other artists. No galleries. No fees.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={() => reset("signup")}
            style={btnAccent({ width: "100%" })}
            onMouseOver={e => e.currentTarget.style.background = "#e8613e"}
            onMouseOut={e => e.currentTarget.style.background = "#c94b2d"}>
            Create Account →
          </button>
          <button onClick={() => reset("login")}
            style={btnOutline({ width: "100%" })}
            onMouseOver={e => e.currentTarget.style.background = "#ede8dc"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <div style={{ width: 420, background: "white", padding: "44px 38px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", borderRadius: 8 }}>
        <button onClick={() => reset(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "#9e9589", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28, padding: 0 }}>
          ← Back
        </button>
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
        <button onClick={submit}
          style={btnPrimary({ width: "100%", marginBottom: 16 })}
          onMouseOver={e => e.currentTarget.style.background = "#c94b2d"}
          onMouseOut={e => e.currentTarget.style.background = "#0d0d0d"}>
          {mode === "signup" ? "Create Account →" : "Sign In →"}
        </button>
        <button onClick={() => reset(mode === "signup" ? "login" : "signup")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "#9e9589", textDecoration: "underline", width: "100%", textAlign: "center" }}>
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}
