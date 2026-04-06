import { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, collectionGroup } from "firebase/firestore";
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
  const [artworks, setArtworks] = useState([]);
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
        // Users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = await Promise.all(usersSnap.docs.map(async d => {
          const artSnap = await getDocs(collection(db, "users", d.id, "artworks"));
          return { uid: d.id, ...d.data(), artworkCount: artSnap.size };
        }));
        setUsers(usersData);

        // All artworks
        const artSnap = await getDocs(collectionGroup(db, "artworks"));
        setArtworks(artSnap.docs.map(d => ({
          id: d.id,
          ownerUid: d.ref.parent.parent.id,
          ...d.data()
        })));
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
    if (!window.confirm(`Delete user "${name}"? This will remove their profile and artworks.`)) return;
    try {
      // Delete artworks subcollection
      const artSnap = await getDocs(collection(db, "users", uid, "artworks"));
      await Promise.all(artSnap.docs.map(d => deleteDoc(d.ref)));
      // Delete user doc
      await deleteDoc(doc(db, "users", uid));
      setUsers(u => u.filter(x => x.uid !== uid));
      setArtworks(a => a.filter(x => x.ownerUid !== uid));
      if (selectedUser?.uid === uid) setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // ── Delete artwork ─────────────────────────────────────────────────────────
  const deleteArtwork = async (artwork) => {
    if (!window.confirm(`Delete "${artwork.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "users", artwork.ownerUid, "artworks", artwork.id));
      setArtworks(a => a.filter(x => x.id !== artwork.id));
      setUsers(u => u.map(x => x.uid === artwork.ownerUid
        ? { ...x, artworkCount: Math.max(0, x.artworkCount - 1) }
        : x
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
          setUsers(u => [...u, { uid: cred.user.uid, name, email, bio, location, role: "artist", artworkCount: 0 }]);
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
  const stats = [
    { label: "Total Users",    value: users.length },
    { label: "Total Artworks", value: artworks.length },
    { label: "Admins",         value: users.filter(u => u.role === "admin").length },
  ];

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "rgba(0,0,0,0.07)", margin: "0" }}>
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
                        <button onClick={() => { setSelectedUser(u); setTab("artworks"); }}
                          style={{ ...btn("#f5f0e8", "#0d0d0d"), fontSize: "0.62rem" }}>
                          {u.artworkCount} artwork{u.artworkCount !== 1 ? "s" : ""}
                        </button>
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
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Artwork</th>
                      <th>Artist</th>
                      <th>Medium</th>
                      <th>Year</th>
                      <th>Est. Value</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artworks
                      .filter(a => !selectedUser || a.ownerUid === selectedUser.uid)
                      .map(art => {
                        const owner = users.find(u => u.uid === art.ownerUid);
                        return (
                          <tr key={art.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 48, height: 48, borderRadius: RADIUS, overflow: "hidden", flexShrink: 0 }}>
                                  {art.imageUrl
                                    ? <img src={art.imageUrl} alt={art.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : <ArtSVG artwork={art} width={48} height={48} />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{art.title}</div>
                                  <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{art.size}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ color: "#9e9589" }}>{owner?.name || art.artist}</td>
                            <td style={{ color: "#9e9589" }}>{art.medium}</td>
                            <td style={{ color: "#9e9589" }}>{art.year}</td>
                            <td style={{ color: "#c94b2d" }}>{art.estimatedValue ? `£${art.estimatedValue}` : "—"}</td>
                            <td>
                              <button onClick={() => deleteArtwork(art)}
                                style={btn("#c94b2d15", "#c94b2d")}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
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
              Each user will be created in Firebase Auth and Firestore. They'll need to reset their password on first login.
            </p>

            {/* Template download hint */}
            <div style={{ background: "#ede8dc", padding: "16px 20px", borderRadius: RADIUS, marginBottom: 28, fontSize: "0.72rem", lineHeight: 1.7 }}>
              📋 <strong>Required columns:</strong> name · email · password · location (optional) · bio (optional)
            </div>

            {/* Drop zone */}
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

            {/* Results */}
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
