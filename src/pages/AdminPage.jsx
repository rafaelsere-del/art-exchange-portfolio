import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import * as XLSX from "xlsx";
import { RADIUS } from "../styles/theme";
import ArtSVG from "../components/ArtSVG";

// ─── helpers ────────────────────────────────────────────────────────────────
const btn = (bg, color, extra = {}) => ({
  padding: "9px 16px", border: "none", cursor: "pointer",
  fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase",
  background: bg, color, borderRadius: RADIUS, fontFamily: "'DM Mono',monospace",
  transition: "opacity 0.2s", ...extra
});

const TAG = {
  admin:  { background: "#c94b2d22", color: "#c94b2d" },
  artist: { background: "#5a7a5e22", color: "#5a7a5e" },
};

// ─── AdminPage ───────────────────────────────────────────────────────────────
export default function AdminPage({ user, setPage }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = await Promise.all(
          usersSnap.docs.map(async d => {
            // Load artworks subcollection for each user
            const artworksSnap = await getDocs(collection(db, "users", d.id, "artworks"));
            const artworks = artworksSnap.docs.map(a => ({ id: a.id, ...a.data() }));
            return {
              uid: d.id,
              ...d.data(),
              artworks,
              hasArtwork: artworks.length > 0
            };
          })
        );
        setUsers(usersData);
      } catch (err) {
        console.error("Error loading admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Delete user ────────────────────────────────────────────────────────────
  const deleteUser = async (uid, name) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers(u => u.filter(x => x.uid !== uid));
      if (selectedUser?.uid === uid) setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // ── Delete a single artwork ────────────────────────────────────────────────
  const deleteArtwork = async (userUid, artworkId, title) => {
    if (!window.confirm(`Delete artwork "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", userUid, "artworks", artworkId));
      setUsers(prev => prev.map(u =>
        u.uid === userUid
          ? { ...u, artworks: u.artworks.filter(a => a.id !== artworkId), hasArtwork: u.artworks.length > 1 }
          : u
      ));
    } catch (err) {
      console.error("Error deleting artwork:", err);
    }
  };

  // ── Import from Excel ──────────────────────────────────────────────────────
  const handleExcel = async (file) => {
    if (!file) return;
    setImporting(true);
    setImportResults(null);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const workbook = XLSX.read(e.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const results = { created: [], failed: [] };

      for (const row of rows) {
        const name     = String(row.name     || row.Name     || "").trim();
        const email    = String(row.email    || row.Email    || "").trim();
        const password = String(row.password || row.Password || "").trim();
        const location = String(row.location || row.Location || "").trim();
        const bio      = String(row.bio      || row.Bio      || "").trim();

        if (!name || !email || !password) {
          results.failed.push({ email: email || "?", reason: "Missing name, email or password" });
          continue;
        }

        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          await setDoc(doc(db, "users", cred.user.uid), {
            name, email,
            bio: bio || "Artist & collector",
            location: location || "Somewhere beautiful",
            role: "artist",
            createdAt: new Date(),
            createdBy: "admin_import"
          });
          results.created.push({ name, email });
          setUsers(u => [...u, { uid: cred.user.uid, name, email, bio, location, role: "artist", artworks: [], hasArtwork: false }]);
        } catch (err) {
          results.failed.push({ email, reason: err.message });
        }
      }

      setImportResults(results);
      setImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const totalArtworks = users.reduce((sum, u) => sum + (u.artworks?.length || 0), 0);
  const stats = [
    { label: "Total Users",        value: users.length },
    { label: "Total Artworks",     value: totalArtworks },
    { label: "Admins",             value: users.filter(u => u.role === "admin").length },
  ];

  // ─── Flat list for artworks tab ─────────────────────────────────────────────
  const artworkRows = users
    .flatMap(u =>
      (u.artworks || []).map(art => ({
        ...art,
        userName: u.name,
        userLocation: u.location,
        userUid: u.uid
      }))
    )
    .filter(art => !selectedUser || art.userUid === selectedUser.uid);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", background: "#f5f0e8" }}>
      <style>{`
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.12em; color: #9e9589; padding: 10px 14px; text-align: left; border-bottom: 1px solid rgba(0,0,0,0.08); }
        .admin-table td { font-size: 0.78rem; padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; }
        .admin-table tr:hover td { background: rgba(0,0,0,0.02); }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0d0d0d", color: "#f5f0e8", padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 900 }}>
            ART<span style={{ color: "#c94b2d", fontStyle: "italic" }}>x</span>ART
            <span style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#9e9589", marginLeft: 12 }}>Admin</span>
          </div>
          <div style={{ fontSize: "0.62rem", color: "#9e9589", marginTop: 2 }}>Logged in as {user.name}</div>
        </div>
        <button onClick={() => setPage("swipe")} style={btn("#f5f0e820", "#f5f0e8")}>← Back to App</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(0,0,0,0.07)" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#f5f0e8", padding: "24px 32px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.2rem", fontWeight: 900 }}>{s.value}</div>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 40px", background: "white" }}>
        {[["users","Users"], ["artworks","Artworks"], ["import","Import Excel"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "16px 20px", fontSize: "0.68rem", letterSpacing: "0.1em",
            textTransform: "uppercase", fontFamily: "'DM Mono',monospace",
            color: tab === id ? "#c94b2d" : "#9e9589",
            borderBottom: tab === id ? "2px solid #c94b2d" : "2px solid transparent",
            marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding: "32px 40px" }}>

        {/* ── USERS TAB ── */}
        {tab === "users" && (
          <div style={{ background: "white", borderRadius: RADIUS, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#9e9589" }}>Loading...</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Role</th>
                    <th>Artworks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.uid}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{u.bio?.slice(0, 40)}{u.bio?.length > 40 ? "…" : ""}</div>
                      </td>
                      <td style={{ color: "#9e9589" }}>{u.email}</td>
                      <td style={{ color: "#9e9589" }}>{u.location}</td>
                      <td>
                        <span style={{ ...TAG[u.role] || TAG.artist, padding: "3px 8px", borderRadius: RADIUS, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          {u.role || "artist"}
                        </span>
                      </td>
                      <td>
                        {u.hasArtwork ? (
                          <button onClick={() => { setSelectedUser(u); setTab("artworks"); }}
                            style={{ ...btn("#f5f0e8", "#0d0d0d"), fontSize: "0.62rem" }}>
                            {u.artworks.length} artwork{u.artworks.length !== 1 ? "s" : ""}
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.62rem", color: "#9e9589" }}>No artworks</span>
                        )}
                      </td>
                      <td>
                        {u.uid !== user.uid && (
                          <button onClick={() => deleteUser(u.uid, u.name)}
                            style={btn("#c94b2d15", "#c94b2d")}>
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── ARTWORKS TAB ── */}
        {tab === "artworks" && (
          <div>
            {selectedUser && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: "0.78rem" }}>
                  Showing artworks by <strong>{selectedUser.name}</strong>
                </div>
                <button onClick={() => setSelectedUser(null)} style={btn("#f5f0e8", "#0d0d0d")}>
                  Show All
                </button>
              </div>
            )}
            <div style={{ background: "white", borderRadius: RADIUS, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {loading ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9e9589" }}>Loading...</div>
              ) : artworkRows.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9e9589" }}>No artworks found.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Artwork</th>
                      <th>Artist</th>
                      <th>Location</th>
                      <th>Details</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworkRows.map(art => (
                      <tr key={art.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 48, height: 48, borderRadius: RADIUS, overflow: "hidden", flexShrink: 0 }}>
                              {art.imageUrl
                                ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                : <ArtSVG artwork={art} width={48} height={48} />
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{art.title || "Untitled"}</div>
                              <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{art.medium} · {art.year}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#9e9589" }}>{art.userName}</td>
                        <td style={{ color: "#9e9589" }}>{art.userLocation}</td>
                        <td style={{ color: "#9e9589", fontSize: "0.62rem" }}>
                          {art.size || "—"}
                          {art.estimatedValue && <span style={{ color: "#c94b2d", marginLeft: 6 }}>£{art.estimatedValue}</span>}
                        </td>
                        <td>
                          <button onClick={() => deleteArtwork(art.userUid, art.id, art.title)}
                            style={btn("#c94b2d15", "#c94b2d")}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── IMPORT TAB ── */}
        {tab === "import" && (
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, marginBottom: 8 }}>
              Import Users from Excel
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#9e9589", lineHeight: 1.8, marginBottom: 32 }}>
              Upload a .xlsx file with columns: <strong>name</strong>, <strong>email</strong>, <strong>password</strong>, <strong>location</strong>, <strong>bio</strong>.<br />
              Each user will be created in Firebase Auth and Firestore.
            </p>

            <div style={{ background: "#ede8dc", padding: "16px 20px", borderRadius: RADIUS, marginBottom: 28, fontSize: "0.72rem", lineHeight: 1.7 }}>
              📋 <strong>Required columns:</strong> name · email · password · location (optional) · bio (optional)
            </div>

            <div
              onClick={() => fileRef.current.click()}
              style={{ width: "100%", height: 180, border: "2px dashed rgba(0,0,0,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", borderRadius: RADIUS, background: importing ? "rgba(201,75,45,0.04)" : "white", transition: "all 0.2s" }}>
              {importing ? (
                <>
                  <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>⏳</div>
                  <div style={{ fontSize: "0.73rem", color: "#9e9589" }}>Creating users...</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: "1.8rem", marginBottom: 10 }}>📊</div>
                  <div style={{ fontSize: "0.73rem", color: "#9e9589", textAlign: "center", lineHeight: 1.7 }}>
                    Drop your .xlsx file here<br />
                    <span style={{ color: "#c94b2d", textDecoration: "underline" }}>or click to browse</span>
                  </div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }}
                onChange={e => handleExcel(e.target.files[0])} />
            </div>

            {importResults && (
              <div style={{ marginTop: 28 }}>
                {importResults.created.length > 0 && (
                  <div style={{ background: "#5a7a5e15", border: "1px solid #5a7a5e30", borderRadius: RADIUS, padding: "16px 20px", marginBottom: 16 }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#5a7a5e", marginBottom: 10, fontWeight: 700 }}>
                      ✓ {importResults.created.length} user{importResults.created.length !== 1 ? "s" : ""} created
                    </div>
                    {importResults.created.map((u, i) => (
                      <div key={i} style={{ fontSize: "0.72rem", color: "#0d0d0d", marginBottom: 4 }}>
                        {u.name} — {u.email}
                      </div>
                    ))}
                  </div>
                )}
                {importResults.failed.length > 0 && (
                  <div style={{ background: "#c94b2d15", border: "1px solid #c94b2d30", borderRadius: RADIUS, padding: "16px 20px" }}>
                    <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#c94b2d", marginBottom: 10, fontWeight: 700 }}>
                      ✕ {importResults.failed.length} failed
                    </div>
                    {importResults.failed.map((u, i) => (
                      <div key={i} style={{ fontSize: "0.72rem", color: "#0d0d0d", marginBottom: 4 }}>
                        {u.email} — <span style={{ color: "#c94b2d" }}>{u.reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
