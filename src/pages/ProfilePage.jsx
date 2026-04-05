import { useState } from "react";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Field, FieldArea } from "../components/Fields";
import { RADIUS } from "../styles/theme";

export default function ProfilePage({ user, setUser, setPage }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user.name, bio: user.bio, location: user.location });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setPage("home");
    } catch (error) {
      console.error("Error al salir", error);
    }
  };

  const saveProfile = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: form.name, bio: form.bio, location: form.location,
        email: user.email, updatedAt: new Date()
      }, { merge: true });
      setUser(u => ({ ...u, name: form.name, bio: form.bio, location: form.location }));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error("Error guardando perfil:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 60px 60px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d" }}>Your Profile</div>
          {!editing && (
            <button onClick={() => setEditing(true)} style={{ background: "none", border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 16px", color: "#0d0d0d", borderRadius: RADIUS }}>
              Edit Profile
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginBottom: 44 }}>
          <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#c94b2d", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 900, flexShrink: 0 }}>
            {user.name[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            {editing ? (
              <div>
                <Field label="Name *" name="name" value={form.name} onChange={handle} placeholder="Your name" />
                <Field label="Location" name="location" value={form.location} onChange={handle} placeholder="City, Country" />
                <FieldArea label="Bio" name="bio" value={form.bio} onChange={handle} placeholder="Tell other artists who you are..." />
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button onClick={saveProfile} disabled={saving} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "11px 22px", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", opacity: saving ? 0.6 : 1, borderRadius: RADIUS }}>
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button onClick={() => { setEditing(false); setForm({ name: user.name, bio: user.bio, location: user.location }); }} style={{ background: "transparent", color: "#9e9589", padding: "11px 18px", border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: RADIUS }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4 }}>{user.name}</h1>
                <div style={{ fontSize: "0.7rem", color: "#9e9589", marginBottom: 8 }}>{user.location}</div>
                <div style={{ fontSize: "0.78rem", lineHeight: 1.7 }}>{user.bio}</div>
                {saved && <div style={{ fontSize: "0.68rem", color: "#5a7a5e", marginTop: 10 }}>✓ Profile updated</div>}
              </>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, background: "rgba(0,0,0,0.07)", marginBottom: 44, borderRadius: RADIUS, overflow: "hidden" }}>
          {[["Artworks Listed", user.artworks?.length||0], ["Matches", user.matches?.length||0], ["Trades Made", 0]].map(([l,v]) => (
            <div key={l} style={{ background: "#f5f0e8", padding: "22px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2rem", fontWeight: 900 }}>{v}</div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>

        <button onClick={handleSignOut} style={{ background: "transparent", color: "#9e9589", padding: "11px 22px", border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: RADIUS }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
