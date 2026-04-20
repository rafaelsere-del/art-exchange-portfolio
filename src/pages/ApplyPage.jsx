import { useState, useRef } from "react";
import { db, storage } from "../firebase";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { Field, FieldArea } from "../components/Fields";
import { btnPrimary, btnAccent, btnOutline, RADIUS } from "../styles/theme";

export default function ApplyPage({ settings, setPage }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", location: "", bio: "",
    artistStatement: "", artworkTitle: "", artworkDescription: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [imageError, setImageError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  if (!settings.applicationsEnabled) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <div style={{ textAlign: "center", maxWidth: 400 }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#6a7260", marginBottom: 16 }}>Applications</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", fontWeight: 600, marginBottom: 16 }}>
            Currently <em style={{ color: "#b8953a" }}>Closed</em>
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#6a7260", lineHeight: 1.8, marginBottom: 32 }}>
            Applications are not open at this time. Please check back later.
          </p>
          <button onClick={() => setPage("home")} style={btnOutline({ width: "100%" })}
            onMouseOver={e => e.currentTarget.style.background = "#e8e4db"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleFile = file => {
    if (!file) return;
    setImageError("");
    if (file.size > 10 * 1024 * 1024) { setImageError("Max image size is 10 MB."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const validateStep1 = () => {
    if (!form.name.trim()) { setError("Name is required."); return false; }
    if (!form.email.trim()) { setError("Email is required."); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.artistStatement.trim()) { setError("Artist statement is required."); return false; }
    if (!form.artworkTitle.trim()) { setError("Artwork title is required."); return false; }
    return true;
  };

  const nextStep = () => {
    setError("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep(s => s + 1);
  };

  const submit = async () => {
    setError("");
    setSaving(true);
    try {
      const existing = await getDocs(
        query(collection(db, "applications"),
          where("email", "==", form.email.trim().toLowerCase()),
          where("status", "in", ["pending", "accepted"])
        )
      );
      if (!existing.empty) {
        setError("An application for this email already exists. Check your status from the sign-in page.");
        setSaving(false);
        return;
      }

      const docRef = await addDoc(collection(db, "applications"), {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        bio: form.bio.trim() || "Artist & collector",
        location: form.location.trim() || "Somewhere beautiful",
        artistStatement: form.artistStatement.trim(),
        artworkTitle: form.artworkTitle.trim(),
        artworkDescription: form.artworkDescription.trim(),
        artworkImageUrl: null,
        status: "pending",
        createdAt: new Date()
      });

      if (imageFile) {
        const fileRef2 = storageRef(storage, `applications/${docRef.id}/artwork.jpg`);
        await uploadBytes(fileRef2, imageFile);
        const url = await getDownloadURL(fileRef2);
        await updateDoc(doc(db, "applications", docRef.id), { artworkImageUrl: url });
      }

      setStep(4);
    } catch (err) {
      setError("Error submitting application: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const Dots = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
      {[1, 2, 3].map(n => (
        <div key={n} style={{
          width: 8, height: 8, borderRadius: "50%",
          background: n <= step ? "#b8953a" : "rgba(0,0,0,0.15)",
          transition: "background 0.3s"
        }} />
      ))}
    </div>
  );

  const cardStyle = {
    width: "100%", maxWidth: 480, background: "white",
    padding: "44px 38px", boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
    borderRadius: RADIUS
  };

  if (step === 4) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
        <div style={{ ...cardStyle, textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 20 }}>✓</div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#5a7a5e", marginBottom: 12 }}>Application Received</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.8rem", fontWeight: 600, marginBottom: 16 }}>
            Thank you, <em style={{ color: "#b8953a" }}>{form.name.split(" ")[0]}</em>
          </h2>
          <p style={{ fontSize: "0.75rem", color: "#6a7260", lineHeight: 1.9, marginBottom: 32, maxWidth: 340, margin: "0 auto 32px" }}>
            We'll review your work and get back to you. You can check your application status any time from the sign-in page.
          </p>
          <button onClick={() => setPage("home")} style={btnOutline({ width: "100%" })}
            onMouseOver={e => e.currentTarget.style.background = "#e8e4db"}
            onMouseOut={e => e.currentTarget.style.background = "transparent"}>
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 20px" }}>
      <div style={cardStyle}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : setPage("auth")}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 28, padding: 0 }}>
          ← Back
        </button>

        <Dots />

        {step === 1 && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Apply to <em style={{ color: "#b8953a" }}>Join</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 28, lineHeight: 1.7 }}>
              Tell us about yourself — step 1 of 3.
            </p>
            <Field label="Your Name *" name="name" value={form.name} onChange={handle} placeholder="e.g. Sofia Kwan" />
            <Field label="Email *" name="email" value={form.email} onChange={handle} type="email" placeholder="you@example.com" />
            <Field label="Location" name="location" value={form.location} onChange={handle} placeholder="City, Country" />
            <FieldArea label="Short Bio" name="bio" value={form.bio} onChange={handle} placeholder="Tell other artists who you are..." />
          </>
        )}

        {step === 2 && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Your <em style={{ color: "#b8953a" }}>Work</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 28, lineHeight: 1.7 }}>
              Share your practice and a piece to review — step 2 of 3.
            </p>
            <FieldArea label="Artist Statement *" name="artistStatement" value={form.artistStatement} onChange={handle}
              placeholder="What drives your practice? What themes or materials do you work with?" />
            <Field label="Artwork Title *" name="artworkTitle" value={form.artworkTitle} onChange={handle} placeholder="e.g. Untitled No. 7" />
            <FieldArea label="Artwork Description" name="artworkDescription" value={form.artworkDescription} onChange={handle}
              placeholder="Medium, size, year, any context you'd like to share..." />

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#6a7260", marginBottom: 5 }}>
                Artwork Image
              </label>
              <div
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                style={{
                  width: "100%", height: preview ? "auto" : 140,
                  border: `2px dashed ${dragOver ? "#b8953a" : "rgba(0,0,0,0.18)"}`,
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: preview ? "flex-start" : "center",
                  cursor: "pointer", borderRadius: RADIUS, background: "#f7f5f0",
                  overflow: "hidden", transition: "border-color 0.2s"
                }}>
                {preview
                  ? <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 260, objectFit: "cover" }} />
                  : <>
                      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>+</div>
                      <div style={{ fontSize: "0.7rem", color: "#6a7260", textAlign: "center", lineHeight: 1.7 }}>
                        Drop image here or{" "}
                        <span style={{ color: "#b8953a", textDecoration: "underline" }}>click to browse</span>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "#6a7260", marginTop: 4 }}>Max 10 MB</div>
                    </>
                }
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={e => handleFile(e.target.files[0])} />
              {preview && (
                <button onClick={e => { e.stopPropagation(); setImageFile(null); setPreview(null); }}
                  style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", color: "#6a7260", textDecoration: "underline", padding: 0 }}>
                  Remove image
                </button>
              )}
              {imageError && <p style={{ fontSize: "0.65rem", color: "#b8953a", marginTop: 6 }}>{imageError}</p>}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.9rem", fontWeight: 600, marginBottom: 6, letterSpacing: "-0.02em" }}>
              Review & <em style={{ color: "#b8953a" }}>Submit</em>
            </h2>
            <p style={{ fontSize: "0.7rem", color: "#6a7260", marginBottom: 28, lineHeight: 1.7 }}>
              Check everything looks right before submitting.
            </p>

            <div style={{ background: "#f7f5f0", borderRadius: RADIUS, padding: "20px 22px", marginBottom: 24, fontSize: "0.75rem", lineHeight: 1.8 }}>
              <Row label="Name"      value={form.name} />
              <Row label="Email"     value={form.email} />
              {form.location && <Row label="Location"  value={form.location} />}
              {form.bio      && <Row label="Bio"       value={form.bio} />}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "12px 0" }} />
              <Row label="Artwork"   value={form.artworkTitle} />
              {form.artworkDescription && <Row label="Description" value={form.artworkDescription} />}
              {preview && (
                <div style={{ marginTop: 12 }}>
                  <img src={preview} alt="Artwork" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: RADIUS }} />
                </div>
              )}
            </div>

            {error && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}

            <button onClick={submit} disabled={saving}
              style={btnAccent({ width: "100%", marginBottom: 12, opacity: saving ? 0.6 : 1 })}
              onMouseOver={e => { if (!saving) e.currentTarget.style.background = "#e8613e"; }}
              onMouseOut={e => { if (!saving) e.currentTarget.style.background = "#b8953a"; }}>
              {saving ? "Submitting…" : "Submit Application →"}
            </button>
          </>
        )}

        {error && step < 3 && <p style={{ fontSize: "0.68rem", color: "#b8953a", marginBottom: 14 }}>{error}</p>}

        {step < 3 && (
          <button onClick={nextStep}
            style={btnPrimary({ width: "100%" })}
            onMouseOver={e => e.currentTarget.style.background = "#b8953a"}
            onMouseOut={e => e.currentTarget.style.background = "#14120e"}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
      <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#6a7260", minWidth: 80, paddingTop: 1 }}>{label}</span>
      <span style={{ color: "#14120e", flex: 1, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}