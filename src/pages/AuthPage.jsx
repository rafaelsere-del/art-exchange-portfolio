import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc, getDoc, getDocs, addDoc, collection, query, where, updateDoc } from "firebase/firestore";
import { Field, FieldArea } from "../components/Fields";
import { btnPrimary, btnAccent, btnOutline, RADIUS } from "../styles/theme";

const INVITE_ERRORS = {
  not_found: "This invite link is invalid.",
  expired:   "This invite link has expired. Contact the administrator for a new one.",
  used:      "This invite has already been used. If you have an account, sign in below."
};

export default function AuthPage({ setUser, setPage, settings = {}, settingsLoading = false, inviteToken, inviteData, inviteLoading, completeAppId }) {
  const [mode, setMode] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", bio: "", location: "" });
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [statusResult, setStatusResult] = useState(null);
  const [appData, setAppData] = useState(null);
  const [checking, setChecking] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const reset = (newMode) => {
    setForm({ name: "", email: "", password: "", confirmPassword: "", bio: "", location: "" });
    setError("");
    setStatusResult(null);
    setMode(newMode);
  };

  useEffect(() => {
    if (inviteData?.valid) {
      setForm(f => ({ ...f, email: inviteData.email }));
      setMode("invite-signup");
    }
  }, [inviteData]);

  useEffect(() => {
    if (!completeAppId) return;
    getDoc(doc(db, "applications", completeAppId)).then(snap => {
      if (!snap.exists()) return;
      const data = { id: snap.id, ...snap.data() };
      if (data.status === "accepted" && !data.usedByUid) {
        setAppData(data);
        setMode("complete-signup");
      }
    });
  }, [completeAppId]);

  const signIn = async () => {
    if (!form.email || !form.password) { setError("Email and password required."); return; }
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(auth, form.email, form.password);
      const firebaseUser = userCredential.user;

      const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};

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
            color2: otherArtwork?.color2 || "#b8953a",
            shape: otherArtwork?.shape || "lines",
          };
        });

      const likesSnap = await getDocs(collection(db, "likes"));
      const liked = likesSnap.docs
        .filter(d => d.data().from === firebaseUser.uid)
        .map(d => d.data().to);

      const artworksSnap = await getDocs(collection(db, "users", firebaseUser.uid, "artworks"));
      const artworks = artworksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setUser({
        uid: firebaseUser.uid,
        name: profile.name || firebaseUser.displayName || form.email.split("@")[0],
        email: firebaseUser.email,
        bio: profile.bio || "Artist & collector",
        location: profile.location || "Somewhere beautiful",
        role: profile.role || "artist",
        artworkImageUrl: profile.artworkImageUrl || profile.artworkBase64 || null,
        artworks, matches, liked, passed: []
      });
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const signUp = async () => {
    if (!form.email || !form.password) { setError("Email and password required."); return; }
    if (!form.name) { setError("Name required."); return; }
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const firebaseUser = userCredential.user;
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name: form.name, email: form.email,
        bio: form.bio || "Artist & collector",
        location: form.location || "Somewhere beautiful",
        role: "artist", createdAt: new Date()
      });
      setUser({
        uid: firebaseUser.uid, name: form.name, email: form.email,
        bio: form.bio || "Artist & collector",
        location: form.location || "Somewhere beautiful",
        role: "artist", artworks: [], matches: [], liked: [], passed: []
      });
    } catch (err) {
      setError("Error: " + err.message);
    }
  };

  const inviteSignUp = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.password) { setError("Password is required."); return; }
    setError("");
    try {
      const email = inviteData.email;
      const userCredential = await createUserWithEmailAndPassword(auth, email, form.password);
      const firebaseUser = userCredential.user;
      await setDoc(doc(db, "users", firebaseUser.uid), {
        name: form.name.trim(), email,
        bio: "Artist & collector", location: "Somewhere beautiful",
        role: "artist", createdAt: new Date(), createdVia: "invitation"
      });
      await updateDoc(doc(db, "invitations", inviteToken), {
        status: "used", usedAt: new Date(), usedByUid: firebaseUser.uid
      });
      setUser({
        uid: firebaseUser.uid, name: form.name.trim(), email,
        bio: "Artist & collector", location: "Somewhere beautiful",
        role: "artist", artworks: [], matches: [], liked: [], passed: []
      });
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try signing in.");
      } else {
        setError("Error: " + err.message);
      }
    }
  };

  const checkStatus = async () => {
    if (!form.email.trim()) { setError("Email is required."); return; }
    setError("");
    setChecking(true);
    try {
      const snap = await getDocs(
        query(collection(db, "applications"), where("email", "==", form.email.trim().toLowerCase()))
      );
      if (snap.empty) { setStatusResult({ status: "not_found" }); return; }
      const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      const latest = docs[0];
      setStatusResult({ status: latest.status, rejectionReason: latest.rejectionReason });
      if (latest.status === "accepted") {
        setAppData(latest);
        setMode("complete-signup");
      }
    } catch (err) {
      setError("Error checking status: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const completeSignUp = async () => {
    if (!form.password) { setError("Password is required."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError("");

    const finishWithUser = async (firebaseUser, isNew) => {
      if (isNew) {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: appData.name, email: appData.email,
          bio: appData.bio || "Artist & collector",
          location: appData.location || "Somewhere beautiful",
          role: "artist", createdAt: new Date(),
          createdVia: "application", applicationId: appData.id
        });
      }
      await updateDoc(doc(db, "applications", appData.id), { usedByUid: firebaseUser.uid });

      let artworks = [];
      if (appData.artworkImageUrl) {
        const existingSnap = await getDocs(collection(db, "users", firebaseUser.uid, "artworks"));
        const alreadyLoaded = existingSnap.docs.some(d => d.data().imageUrl === appData.artworkImageUrl);
        if (!alreadyLoaded) {
          const shapes = ["lines", "triangle", "blocks", "circle", "grid", "waves"];
          const randHex = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
          const color1 = randHex();
          const color2 = randHex();
          const shape = shapes[Math.floor(Math.random() * shapes.length)];
          const artworkData = {
            title: appData.artworkTitle || "Untitled",
            artist: appData.name,
            location: appData.location || "Unknown",
            medium: "Unknown",
            size: "",
            year: new Date().getFullYear(),
            description: appData.artworkDescription || "",
            imageUrl: appData.artworkImageUrl,
            color1, color2, shape,
            likes: 0,
            createdAt: new Date()
          };
          const artworkRef = await addDoc(collection(db, "users", firebaseUser.uid, "artworks"), artworkData);
          artworks = [{ id: artworkRef.id, ...artworkData }];
        } else {
          artworks = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }

      const profileSnap = await getDoc(doc(db, "users", firebaseUser.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};
      setUser({
        uid: firebaseUser.uid,
        name: profile.name || appData.name,
        email: appData.email,
        bio: profile.bio || appData.bio || "Artist & collector",
        location: profile.location || appData.location || "Somewhere beautiful",
        role: profile.role || "artist",
        artworks, matches: [], liked: [], passed: []
      });
    };

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, appData.email, form.password);
      await finishWithUser(userCredential.user, true);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, appData.email, form.password);
          await finishWithUser(userCredential.user, false);
        } catch (signInErr) {
          setError("wrong-password");
        }
      } else {
        setError("Error: " + err.message);
      }
    }
  };

  if (mode === null) {
    const { openRegistrationEnabled = true, applicationsEnabled = false } = settings;
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <div style={{ width: 420, textAlign: "center" }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#b8953a", marginBottom: 16 }}>Welcome</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2.4rem", fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 12 }}>
            The Art <em style={{ color: "#b8953a" }}>Exchange</em>
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#6a7260", lineHeight: 1.8, marginBottom: 44, maxWidth: 320, margin: "0 auto 44px" }}>
            Trade your artwork directly with other artists. No galleries. No fees.
          </p>

          {inviteData && !inviteData.valid && (
            <div style={{ background: "#b8953a12", border: "1px solid #b8953a30", borderRadius: RADIUS, padding: "12px 16px", marginBottom: 20, fontSize: "0.72rem", color: "#b8953a", lineHeight: 1.6 }}>
              {INVITE_ERRORS[inviteData.reason] || "This invite link is invalid."}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {settingsLoading ? (
              <div style={{ color: "#6a7260", fontSize: "0.7rem", padding: "12px 0" }}>Loading…</div>
            ) : (
              <>
                {openRegistrationEnabled && (
                  <button onClick={() => reset("signup")}
                    style={btnPrimary({ width: "100%" })}
                    onMouseOver={e => e.currentTarget.style.opacity = "0.88"}
                    onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                    Create Account →
                  </button>
                )}
                {applicationsEnabled && (
                  <button onClick={() => setPage("apply")}
                    style={btnPrimary({ width: "100%" })}
                    onMouseOver={e => e.currentTarget.style.opacity = "0.88"}
                    onMouseOut={e => e.currentTarget.style.opacity = "1"}>
                    Apply to Join →
                  </button>
                )}
                <button onClick={() => reset("login")}
                  style={{ ...btnPrimary({ width: "100%" }), background: "transparent", color: "#14120e", border: "1.5px solid rgba(20,18,14,0.25)" }}
                  onMouseOver={e => { e.currentTarget.style.background = "#f7f5f0"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "transparent"; }}>
                  Sign In
                </button>
                {applicationsEnabled && (
                  <button onClick={() => reset("check-status")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "#6a7260", textDecoration: "underline", padding: "4px 0" }}>
                    Check application status
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <div style={{ width: 420, background: "white", padding: "44px 38px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", borderRadius: RADIUS }}>
        <button onClick={() => reset(null)}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28, padding: 0 }}>
          ← Back
        </button>

        {mode === "login" && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Welcome <em style={{ color: "#b8953a" }}>back</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 32, lineHeight: 1.7 }}>Sign in to continue your swaps.</p>
            <Field label="Email *" name="email" value={form.email} onChange={handle} type="email" placeholder="you@example.com" />
            <Field label="Password *" name="password" value={form.password} onChange={handle} type="password" placeholder="••••••••" />
            {error && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}
            <button onClick={signIn}
              style={btnPrimary({ width: "100%", marginBottom: 16 })}
              onMouseOver={e => e.currentTarget.style.background = "#b8953a"}
              onMouseOut={e => e.currentTarget.style.background = "#14120e"}>
              Sign In →
            </button>
            {settings.openRegistrationEnabled && (
              <button onClick={() => reset("signup")}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "#6a7260", textDecoration: "underline", width: "100%", textAlign: "center" }}>
                New here? Create an account
              </button>
            )}
          </>
        )}

        {mode === "signup" && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Join the <em style={{ color: "#b8953a" }}>Exchange</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 32, lineHeight: 1.7 }}>Create your artist account and start trading.</p>
            <Field label="Your Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Sofia Kwan" />
            <Field label="Email *" name="email" value={form.email} onChange={handle} type="email" placeholder="you@example.com" />
            <Field label="Password *" name="password" value={form.password} onChange={handle} type="password" placeholder="••••••••" />
            <Field label="Location" name="location" value={form.location} onChange={handle} placeholder="City, Country" />
            <FieldArea label="Short Bio" name="bio" value={form.bio} onChange={handle} placeholder="Tell other artists who you are..." />
            {error && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}
            <button onClick={signUp}
              style={btnPrimary({ width: "100%", marginBottom: 16 })}
              onMouseOver={e => e.currentTarget.style.background = "#b8953a"}
              onMouseOut={e => e.currentTarget.style.background = "#14120e"}>
              Create Account →
            </button>
            <button onClick={() => reset("login")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.68rem", color: "#6a7260", textDecoration: "underline", width: "100%", textAlign: "center" }}>
              Already have an account? Sign in
            </button>
          </>
        )}

        {mode === "invite-signup" && (
          <>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#5a7a5e", marginBottom: 12 }}>Invitation</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              {inviteData?.inviteeName
                ? <>Welcome, <em style={{ color: "#b8953a" }}>{inviteData.inviteeName.split(" ")[0]}</em></>
                : <>You've been <em style={{ color: "#b8953a" }}>invited</em></>}
            </h2>
<p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: inviteData?.personalMessage ? 16 : 32, lineHeight: 1.7 }}>
              {inviteData?.personalMessage || "Complete your account to join the exchange."}
            </p>
            {inviteData?.personalMessage && (
              <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 32, lineHeight: 1.7 }}>
                Complete your account to join the exchange.
              </p>
            )}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6a7260", marginBottom: 5 }}>Email</label>
              <input value={inviteData?.email || ""} readOnly
                style={{ width: "100%", padding: "11px 13px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#e8e4db", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Sans',monospace", boxSizing: "border-box", color: "#6a7260" }} />
            </div>
            <Field label="Your Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Sofia Kwan" />
            <Field label="Password *" name="password" value={form.password} onChange={handle} type="password" placeholder="••••••••" />
            {error && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}
            <button onClick={inviteSignUp}
              style={btnAccent({ width: "100%" })}
              onMouseOver={e => e.currentTarget.style.background = "#e8613e"}
              onMouseOut={e => e.currentTarget.style.background = "#b8953a"}>
              Join the Exchange →
            </button>
          </>
        )}

        {mode === "check-status" && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Application <em style={{ color: "#b8953a" }}>Status</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 32, lineHeight: 1.7 }}>
              Enter the email you applied with to check your status.
            </p>
            <Field label="Email *" name="email" value={form.email} onChange={handle} type="email" placeholder="you@example.com" />
            {error && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}

            {statusResult && !checking && (
              <div style={{
                borderRadius: RADIUS, padding: "14px 16px", marginBottom: 20, fontSize: "0.75rem", lineHeight: 1.7,
                ...(statusResult.status === "pending"   ? { background: "#c9952d12", color: "#c9952d", border: "1px solid #c9952d30" } :
                   statusResult.status === "rejected"  ? { background: "#b8953a12", color: "#b8953a", border: "1px solid #b8953a30" } :
                   statusResult.status === "not_found" ? { background: "#f7f5f0",   color: "#6a7260", border: "1px solid rgba(0,0,0,0.08)" } :
                                                         { background: "#5a7a5e12", color: "#5a7a5e", border: "1px solid #5a7a5e30" })
              }}>
                {statusResult.status === "pending"   && "Your application is under review. We'll be in touch soon."}
                {statusResult.status === "not_found" && "No application found for this email."}
                {statusResult.status === "rejected"  && (
                  <>
                    Your application was not accepted at this time.
                    {statusResult.rejectionReason && <><br /><span style={{ opacity: 0.8 }}>{statusResult.rejectionReason}</span></>}
                  </>
                )}
                {statusResult.status === "accepted"  && "Your application was accepted! Proceeding to complete your signup…"}
              </div>
            )}

            <button onClick={checkStatus} disabled={checking}
              style={btnPrimary({ width: "100%", opacity: checking ? 0.6 : 1 })}
              onMouseOver={e => { if (!checking) e.currentTarget.style.background = "#b8953a"; }}
              onMouseOut={e => { if (!checking) e.currentTarget.style.background = "#14120e"; }}>
              {checking ? "Checking…" : "Check Status →"}
            </button>
          </>
        )}

        {mode === "complete-signup" && appData && (
          <>
            <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#5a7a5e", marginBottom: 12 }}>Application Accepted</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Welcome, <em style={{ color: "#b8953a" }}>{appData.name.split(" ")[0]}</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 32, lineHeight: 1.7 }}>
              Your application was accepted. Set a password to complete your account.
            </p>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6a7260", marginBottom: 5 }}>Email</label>
              <input value={appData.email} readOnly
                style={{ width: "100%", padding: "11px 13px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#e8e4db", fontSize: "0.82rem", outline: "none", fontFamily: "'DM Sans',monospace", boxSizing: "border-box", color: "#6a7260" }} />
            </div>
            <Field label="Password *" name="password" value={form.password} onChange={handle} type="password" placeholder="Min. 6 characters" />
            <Field label="Confirm Password *" name="confirmPassword" value={form.confirmPassword} onChange={handle} type="password" placeholder="••••••••" />
            {error === "wrong-password" ? (
              <div style={{ marginBottom: 14 }}>
                {resetSent ? (
                  <p style={{ fontSize: "0.68rem", color: "#5a7a5e" }}>
                    Password reset email sent to {appData.email}. Check your inbox and sign in below.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 8 }}>
                      An account already exists for this email. If you set a password before, try signing in — or reset it.
                    </p>
                    <button
                      onClick={async () => {
                        await sendPasswordResetEmail(auth, appData.email);
                        setResetSent(true);
                      }}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "0.68rem", color: "#b8953a", textDecoration: "underline" }}>
                      Send password reset email →
                    </button>
                  </>
                )}
              </div>
            ) : error ? (
              <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>
            ) : null}
            <button onClick={completeSignUp}
              style={btnAccent({ width: "100%" })}
              onMouseOver={e => e.currentTarget.style.background = "#e8613e"}
              onMouseOut={e => e.currentTarget.style.background = "#b8953a"}>
              Complete Signup →
            </button>
          </>
        )}
      </div>
    </div>
  );
}