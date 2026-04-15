import { useState, useRef } from "react";
import { db, storage } from "../firebase";
import { doc, setDoc, addDoc, collection, deleteDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import ArtSVG from "../components/ArtSVG";
import { Field, FieldArea } from "../components/Fields";
import { RADIUS } from "../styles/theme";

export default function GalleryPage({ user, setUser }) {
  const [showUpload, setShowUpload] = useState(false);
  const [editArtwork, setEditArtwork] = useState(null);
  const [form, setForm] = useState({ title: "", medium: "", size: "", year: String(new Date().getFullYear()), description: "", estimatedValue: "" });
  const [editForm, setEditForm] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileRef = useRef();

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleEdit = e => setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const openEdit = (art) => {
    setEditArtwork(art);
    setEditForm({
      title: art.title || "", medium: art.medium || "",
      size: art.size || "", year: art.year ? String(art.year) : "",
      description: art.description || "", estimatedValue: art.estimatedValue || "",
    });
  };

  const updateArtwork = async () => {
    if (!editForm.title || !editForm.medium) return;
    setSaving(true);
    try {
      const updated = {
        title: editForm.title, medium: editForm.medium,
        size: editForm.size || "Unknown size",
        year: parseInt(editForm.year) || 2024,
        description: editForm.description,
        estimatedValue: editForm.estimatedValue || null,
        updatedAt: new Date()
      };
      await setDoc(doc(db, "users", user.uid, "artworks", editArtwork.id), updated, { merge: true });
      setUser(u => ({ ...u, artworks: u.artworks.map(a => a.id === editArtwork.id ? { ...a, ...updated } : a) }));
      setEditArtwork(null);
    } catch (err) {
      console.error("Error actualizando artwork:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteArtwork = async () => {
    if (!window.confirm(`Delete "${editArtwork.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "artworks", editArtwork.id));
      setUser(u => ({ ...u, artworks: u.artworks.filter(a => a.id !== editArtwork.id) }));
      setEditArtwork(null);
    } catch (err) {
      console.error("Error eliminando artwork:", err);
    }
  };

  const handleFile = file => {
    if (!file) return;
    setImageError("");
    if (file.size > 10 * 1024 * 1024) {
      setImageError("Max. image size is 10 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const submitArtwork = async () => {
    if (!form.title || !form.medium) return;
    setSaving(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileRef_ = storageRef(storage, `artworks/${user.uid}/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef_, imageFile);
        imageUrl = await getDownloadURL(fileRef_);
        await setDoc(doc(db, "users", user.uid), { artworkImageUrl: imageUrl }, { merge: true });
        setUser(u => ({ ...u, artworkImageUrl: imageUrl }));
      }

      const colors = [["#c9952d","#c94b2d"],["#1a1a2e","#7a7aac"],["#2d4a3e","#8fa58a"],["#3a3a5c","#c94b2d"],["#1a3a4a","#4a8aaa"]];
      const [c1,c2] = colors[Math.floor(Math.random()*colors.length)];
      const shapes = ["lines","triangle","blocks","circle","grid","waves"];
      const newArtwork = {
        title: form.title, artist: user.name, location: user.location,
        medium: form.medium, size: form.size || "Unknown size",
        year: parseInt(form.year) || 2024, description: form.description,
        estimatedValue: form.estimatedValue || null, imageUrl,
        color1: c1, color2: c2, shape: shapes[Math.floor(Math.random()*shapes.length)],
        likes: 0, createdAt: new Date()
      };
      const docRef = await addDoc(collection(db, "users", user.uid, "artworks"), newArtwork);
      setUser(u => ({ ...u, artworks: [...(u.artworks||[]), { id: docRef.id, ...newArtwork }] }));
      setForm({ title:"", medium:"", size:"", year: String(new Date().getFullYear()), description:"", estimatedValue:"" });
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      setImageFile(null);
      setImageError("");
      setShowUpload(false);
    } catch (err) {
      console.error("Error guardando artwork:", err);
    } finally {
      setSaving(false);
    }
  };

  const modalOverlay = { position: "fixed", inset: 0, background: "rgba(13,13,13,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" };
  const modalBox = { background: "#f5f0e8", width: "min(560px, 95vw)", maxHeight: "90vh", overflowY: "auto", padding: "44px 38px", borderRadius: RADIUS };

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 24px 60px" }}>
      <style>{`
        @media (max-width: 600px) {
          .gallery-header { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
          .gallery-header h1 { font-size: 1.8rem !important; }
          .gallery-upload-btn { width: 100% !important; }
          .modal-box { padding: 28px 20px !important; }
        }
      `}</style>
      <div className="gallery-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 44 }}>
        <div>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#c94b2d", marginBottom: 8 }}>My Gallery</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.6rem", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {user.name}'s <em style={{ color: "#c94b2d" }}>Collection</em>
          </h1>
        </div>
        <button className="gallery-upload-btn" onClick={() => setShowUpload(true)} style={{ background: "#c94b2d", color: "white", padding: "13px 26px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: RADIUS, flexShrink: 0 }}
          onMouseOver={e => e.target.style.background = "#e8613e"} onMouseOut={e => e.target.style.background = "#c94b2d"}>
          + Upload Artwork
        </button>
      </div>

      {(user.artworks||[]).length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", color: "#9e9589" }}>
          <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎨</div>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontStyle: "italic", marginBottom: 10 }}>Your gallery is empty</p>
          <p style={{ fontSize: "0.75rem", lineHeight: 1.8, marginBottom: 24 }}>Upload your first artwork to start trading with artists around the world.</p>
          <button onClick={() => setShowUpload(true)} style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "13px 28px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: RADIUS }}>
            Upload Your First Piece
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 20 }}>
          {(user.artworks||[]).map(art => (
            <div key={art.id} style={{ background: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transition: "transform 0.3s, box-shadow 0.3s", borderRadius: RADIUS, overflow: "hidden" }}
              onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.14)"; }}
              onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"; }}>
              <div style={{ height: 190, overflow: "hidden" }}>
                {art.imageUrl ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ArtSVG artwork={art} width={300} height={190} />}
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.14em", color: "#5a7a5e", marginBottom: 4 }}>● Available for Trade</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.98rem", fontWeight: 700, marginBottom: 4 }}>{art.title}</div>
                <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{art.medium} · {art.size} · {art.year}</div>
                {art.estimatedValue && <div style={{ fontSize: "0.62rem", color: "#c94b2d", marginTop: 4 }}>Est. £{art.estimatedValue}</div>}
                <button onClick={() => openEdit(art)} style={{ marginTop: 10, background: "none", border: "1px solid rgba(0,0,0,0.13)", cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 10px", color: "#9e9589", width: "100%", borderRadius: RADIUS }}
                  onMouseOver={e => { e.target.style.borderColor = "#c94b2d"; e.target.style.color = "#c94b2d"; }}
                  onMouseOut={e => { e.target.style.borderColor = "rgba(0,0,0,0.13)"; e.target.style.color = "#9e9589"; }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setShowUpload(false)}>
          <div style={modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 900 }}>Add Artwork</h2>
              <button onClick={() => { if (preview) URL.revokeObjectURL(preview); setPreview(null); setImageFile(null); setShowUpload(false); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9e9589" }}>✕</button>
            </div>

            {imageError && (
              <div style={{ background: "#c94b2d15", border: "1px solid #c94b2d40", borderRadius: RADIUS, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1rem" }}>⚠️</span>
                <p style={{ fontSize: "0.72rem", color: "#c94b2d", margin: 0, lineHeight: 1.5 }}>{imageError}</p>
              </div>
            )}

            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current.click()}
              style={{ width: "100%", height: 210, border: `2px dashed ${imageError ? "#c94b2d" : dragOver ? "#c94b2d" : "rgba(0,0,0,0.18)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", marginBottom: 24, background: dragOver ? "rgba(201,75,45,0.04)" : "transparent", position: "relative", overflow: "hidden", transition: "border-color 0.2s, background 0.2s", borderRadius: RADIUS }}>
              {preview
                ? <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <>
                  <div style={{ fontSize: "2rem", marginBottom: 10 }}>🖼</div>
                  <div style={{ fontSize: "0.73rem", color: "#9e9589", textAlign: "center", lineHeight: 1.7 }}>Drag & drop your artwork image<br /><span style={{ color: "#c94b2d", textDecoration: "underline" }}>or click to browse</span></div>
                  <div style={{ fontSize: "0.62rem", color: "#9e9589", marginTop: 6 }}>JPG, PNG, WEBP · Max 10MB</div>
                </>}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}><Field label="Title *" name="title" value={form.title} onChange={handle} placeholder="Name your work" /></div>
              <Field label="Medium *" name="medium" value={form.medium} onChange={handle} placeholder="Oil on canvas..." />
              <Field label="Size" name="size" value={form.size} onChange={handle} placeholder="40x60cm" />
              <Field label="Year" name="year" value={form.year} onChange={handle} placeholder="2024" />
              <Field label="Estimated Value (£)" name="estimatedValue" value={form.estimatedValue} onChange={handle} placeholder="e.g. 400" />
              <div style={{ gridColumn: "1/-1" }}><FieldArea label="Description" name="description" value={form.description} onChange={handle} placeholder="Tell the story behind this piece..." /></div>
            </div>
            <button onClick={submitArtwork} disabled={saving} style={{ width: "100%", background: "#0d0d0d", color: "#f5f0e8", padding: "15px", border: "none", cursor: saving ? "not-allowed" : "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4, borderRadius: RADIUS, opacity: saving ? 0.6 : 1 }}
              onMouseOver={e => { if (!saving) e.target.style.background = "#c94b2d"; }} onMouseOut={e => { if (!saving) e.target.style.background = "#0d0d0d"; }}>
              {saving ? "Uploading..." : "Add to Gallery →"}
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editArtwork && (
        <div style={modalOverlay} onClick={e => e.target === e.currentTarget && setEditArtwork(null)}>
          <div style={modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.7rem", fontWeight: 900 }}>Edit Artwork</h2>
              <button onClick={() => setEditArtwork(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", color: "#9e9589" }}>✕</button>
            </div>
            {editArtwork.imageUrl && (
              <div style={{ width: "100%", height: 180, overflow: "hidden", marginBottom: 24, borderRadius: RADIUS }}>
                <img src={editArtwork.imageUrl} alt={editArtwork.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div style={{ gridColumn: "1/-1" }}><Field label="Title *" name="title" value={editForm.title} onChange={handleEdit} placeholder="Name your work" /></div>
              <Field label="Medium *" name="medium" value={editForm.medium} onChange={handleEdit} placeholder="Oil on canvas..." />
              <Field label="Size" name="size" value={editForm.size} onChange={handleEdit} placeholder="40x60cm" />
              <Field label="Year" name="year" value={editForm.year} onChange={handleEdit} placeholder="2024" />
              <Field label="Estimated Value (£)" name="estimatedValue" value={editForm.estimatedValue} onChange={handleEdit} placeholder="e.g. 400" />
              <div style={{ gridColumn: "1/-1" }}><FieldArea label="Description" name="description" value={editForm.description} onChange={handleEdit} placeholder="Tell the story behind this piece..." /></div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={updateArtwork} disabled={saving} style={{ flex: 1, background: "#0d0d0d", color: "#f5f0e8", padding: "15px", border: "none", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", opacity: saving ? 0.6 : 1, borderRadius: RADIUS }}
                onMouseOver={e => e.target.style.background = "#c94b2d"} onMouseOut={e => e.target.style.background = "#0d0d0d"}>
                {saving ? "Saving..." : "Save Changes →"}
              </button>
              <button onClick={deleteArtwork} style={{ background: "transparent", color: "#c94b2d", padding: "15px 18px", border: "1.5px solid #c94b2d", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase", borderRadius: RADIUS }}
                onMouseOver={e => { e.target.style.background = "#c94b2d"; e.target.style.color = "white"; }}
                onMouseOut={e => { e.target.style.background = "transparent"; e.target.style.color = "#c94b2d"; }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
