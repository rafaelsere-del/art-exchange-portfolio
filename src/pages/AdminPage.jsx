import React, { useState, useEffect, useRef } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, deleteDoc, doc, setDoc, addDoc, updateDoc, query, orderBy, where } from "firebase/firestore";
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

const APP_STATUS = {
  pending:  { background: "#c9952d22", color: "#c9952d" },
  accepted: { background: "#5a7a5e22", color: "#5a7a5e" },
  rejected: { background: "#c94b2d22", color: "#c94b2d" },
};

const Badge = ({ status }) => (
  <span style={{ ...(APP_STATUS[status] || APP_STATUS.pending), padding: "3px 8px", borderRadius: RADIUS, fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
    {status}
  </span>
);

// ─── AdminPage ───────────────────────────────────────────────────────────────
export default function AdminPage({ user, setPage, settings = {}, setSettings }) {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  // New acquisition state
  const [applications, setApplications] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [copiedToken, setCopiedToken] = useState(null);
  const [draftSettings, setDraftSettings] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const loadedTabs = useRef(new Set(["users"]));

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = await Promise.all(
          usersSnap.docs.map(async d => {
const userData = d.data();
const artworksSnap = await getDocs(collection(db, "users", d.id, "artworks"));
let artworks = artworksSnap.docs.map(a => ({ id: a.id, ...a.data() }));
// Fall back to legacy artworkBase64/artworkImageUrl on the user doc
if (artworks.length === 0 && (userData.artworkBase64 || userData.artworkImageUrl)) {
  artworks = [{
    id: "legacy",
    title: userData.artworkFile?.replace(/_/g, " ").replace(/\.jpg$/i, "") || "Artwork",
    imageUrl: userData.artworkImageUrl || userData.artworkBase64 || null,
    medium: "Unknown", year: "", size: "",
    color1: "#c9952d", color2: "#c94b2d", shape: "lines",
    isLegacy: true
  }];
}
return { uid: d.id, ...userData, artworks, hasArtwork: artworks.length > 0 };

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

  // ── Lazy-load applications / invitations ──────────────────────────────────
  useEffect(() => {
    if (tab === "applications" && !loadedTabs.current.has("applications")) {
      loadedTabs.current.add("applications");
      getDocs(query(collection(db, "applications"), orderBy("createdAt", "desc")))
        .then(snap => setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
    if (tab === "invitations" && !loadedTabs.current.has("invitations")) {
      loadedTabs.current.add("invitations");
      getDocs(query(collection(db, "invitations"), orderBy("invitedAt", "desc")))
        .then(snap => setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }
  }, [tab]);

  // ── Accept application ─────────────────────────────────────────────────────
  const acceptApp = async (app) => {
    await updateDoc(doc(db, "applications", app.id), {
      status: "accepted", reviewedAt: new Date(), reviewedBy: user.uid
    });
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "accepted" } : a));
  };

  // ── Reject application ─────────────────────────────────────────────────────
  const rejectApp = async (app) => {
    await updateDoc(doc(db, "applications", app.id), {
      status: "rejected", reviewedAt: new Date(), reviewedBy: user.uid,
      rejectionReason: rejectReason.trim() || null
    });
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "rejected", rejectionReason: rejectReason.trim() } : a));
    setRejectingId(null);
    setRejectReason("");
  };

  // ── Generate invite ────────────────────────────────────────────────────────
  const generateInvite = async () => {
    setInviteError("");
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError("Enter a valid email address."); return;
    }
    const duplicate = invitations.find(i => i.email === email && i.status === "pending");
    if (duplicate) { setInviteError("A pending invite already exists for this email."); return; }
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const inviteUrl = `${window.location.protocol}//${window.location.host}/?invite=${token}`;
    await setDoc(doc(db, "invitations", token), {
      email, token, invitedBy: user.uid, invitedByName: user.name,
      inviteeName: inviteeName.trim() || null,
      personalMessage: personalMessage.trim() || null,
      invitedAt: new Date(), status: "pending", expiresAt
    });
    const newInvite = { id: token, email, token, invitedBy: user.uid, invitedByName: user.name, inviteeName: inviteeName.trim() || null, personalMessage: personalMessage.trim() || null, invitedAt: new Date(), status: "pending", expiresAt };
    setInvitations(prev => [newInvite, ...prev]);
    setInviteEmail("");
    setInviteeName("");
    setPersonalMessage("");
    copyToClipboard(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(t => t === token ? null : t), 3000);
  };

  // ── Copy invite link ───────────────────────────────────────────────────────
  const copyToClipboard = (text) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;opacity:0;top:0;left:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.protocol}//${window.location.host}/?invite=${token}`;
    copyToClipboard(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(t => t === token ? null : t), 3000);
  };

  // ── Revoke invite ──────────────────────────────────────────────────────────
  const revokeInvite = async (token) => {
    await updateDoc(doc(db, "invitations", token), { status: "expired" });
    setInvitations(prev => prev.map(i => i.id === token ? { ...i, status: "expired" } : i));
  };

  // ── Save settings ──────────────────────────────────────────────────────────
  const saveSettings = async () => {
    await setDoc(doc(db, "settings", "acquisition"), {
      ...draftSettings, updatedAt: new Date(), updatedBy: user.uid
    });
    setSettings(draftSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

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
  const pendingApps = applications.filter(a => a.status === "pending").length;
  const activeInvites = invitations.filter(i => i.status === "pending").length;
  const stats = [
    { label: "Total Users",    value: users.length },
    { label: "Total Artworks", value: totalArtworks },
    { label: "Admins",         value: users.filter(u => u.role === "admin").length },
    { label: "Pending Apps",   value: pendingApps },
    { label: "Active Invites", value: activeInvites },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 1, background: "rgba(0,0,0,0.07)" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#f5f0e8", padding: "24px 32px" }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "2.2rem", fontWeight: 900 }}>{s.value}</div>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(0,0,0,0.08)", padding: "0 40px", background: "white", overflowX: "auto" }}>
        {[["users","Users"], ["artworks","Artworks"], ["import","Import Excel"], ["applications","Applications"], ["invitations","Invitations"], ["settings","Settings"]].map(([id, label]) => (
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
        {/* ── APPLICATIONS TAB ── */}
        {tab === "applications" && (
          <div style={{ background: "white", borderRadius: RADIUS, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            {applications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#9e9589" }}>No applications yet.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Email</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Artwork</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <React.Fragment key={app.id}>
                      <tr>
                        <td>
                          <div style={{ fontWeight: 600 }}>{app.name}</div>
                          <div style={{ fontSize: "0.62rem", color: "#9e9589" }}>{app.bio?.slice(0, 40)}{app.bio?.length > 40 ? "…" : ""}</div>
                        </td>
                        <td style={{ color: "#9e9589" }}>{app.email}</td>
                        <td style={{ color: "#9e9589", fontSize: "0.7rem" }}>
                          {app.createdAt?.toDate?.()?.toLocaleDateString() || "—"}
                        </td>
                        <td><Badge status={app.status} /></td>
                        <td>
                          {app.artworkImageUrl
                            ? <button onClick={() => window.open(app.artworkImageUrl, "_blank")} style={btn("#f5f0e8","#0d0d0d")}>View</button>
                            : <span style={{ fontSize: "0.62rem", color: "#9e9589" }}>None</span>
                          }
                        </td>
                        <td>
                          {app.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => acceptApp(app)} style={btn("#5a7a5e22","#5a7a5e")}>Accept</button>
                              <button onClick={() => setRejectingId(rejectingId === app.id ? null : app.id)} style={btn("#c94b2d15","#c94b2d")}>Reject</button>
                            </div>
                          )}
                        </td>
                      </tr>
                      {rejectingId === app.id && (
                        <tr>
                          <td colSpan={6} style={{ background: "#fff8f7", padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <input
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="Reason (optional)"
                                style={{ flex: 1, padding: "8px 12px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f5f0e8", fontSize: "0.78rem", fontFamily: "'DM Mono',monospace", outline: "none", borderRadius: RADIUS }}
                              />
                              <button onClick={() => rejectApp(app)} style={btn("#c94b2d","white")}>Confirm Reject</button>
                              <button onClick={() => { setRejectingId(null); setRejectReason(""); }} style={btn("#f5f0e8","#9e9589")}>Cancel</button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── INVITATIONS TAB ── */}
        {tab === "invitations" && (
          <div>
            {/* Generate invite */}
            <div style={{ background: "white", borderRadius: RADIUS, padding: "24px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 24 }}>
              <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#9e9589", marginBottom: 14 }}>Send an Invitation</div>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={inviteEmail}
                    onChange={e => { setInviteEmail(e.target.value); setInviteError(""); }}
                    placeholder="artist@example.com"
                    style={{ width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f5f0e8", fontSize: "0.82rem", fontFamily: "'DM Mono',monospace", outline: "none", borderRadius: RADIUS, boxSizing: "border-box" }}
                  />
                  <input
                    value={inviteeName}
                    onChange={e => setInviteeName(e.target.value)}
                    placeholder="Invitee's name (optional)"
                    style={{ width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f5f0e8", fontSize: "0.82rem", fontFamily: "'DM Mono',monospace", outline: "none", borderRadius: RADIUS, boxSizing: "border-box" }}
                  />
                  <textarea
                    value={personalMessage}
                    onChange={e => setPersonalMessage(e.target.value)}
                    placeholder="Personal message shown on their signup page (optional)"
                    rows={3}
                    style={{ width: "100%", padding: "10px 13px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f5f0e8", fontSize: "0.78rem", fontFamily: "'DM Mono',monospace", outline: "none", borderRadius: RADIUS, boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 }}
                  />
                  {inviteError && <div style={{ fontSize: "0.65rem", color: "#c94b2d" }}>{inviteError}</div>}
                </div>
                <button onClick={generateInvite} style={btn("#0d0d0d","#f5f0e8", { padding: "10px 20px", alignSelf: "flex-start" })}>
                  Generate Invite
                </button>
              </div>
            </div>

            {/* Invitations table */}
            <div style={{ background: "white", borderRadius: RADIUS, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              {invitations.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: "#9e9589" }}>No invitations sent yet.</div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Invite URL</th>
                      <th>Sent</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map(inv => {
                      const expired = inv.expiresAt?.toDate?.() < new Date();
                      const dimmed = inv.status !== "pending" || expired;
                      return (
                        <tr key={inv.id} style={{ opacity: dimmed ? 0.45 : 1 }}>
                          <td style={{ fontWeight: 600 }}>{inv.email}</td>
                          <td>
                            {inv.status === "pending" && (() => {
                              const url = `${window.location.protocol}//${window.location.host}/?invite=${inv.token}`;
                              return (
                                <input readOnly value={url} onClick={e => e.target.select()}
                                  style={{ width: "100%", minWidth: 260, padding: "4px 8px", fontSize: "0.65rem", border: "1px solid rgba(0,0,0,0.12)", background: "#f5f0e8", fontFamily: "'DM Mono',monospace", borderRadius: RADIUS, cursor: "text" }} />
                              );
                            })()}
                          </td>
                          <td style={{ color: "#9e9589", fontSize: "0.7rem" }}>
                            {inv.invitedAt?.toDate?.()?.toLocaleDateString() || "—"}
                          </td>
                          <td><Badge status={expired && inv.status === "pending" ? "rejected" : inv.status} /></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              {inv.status === "pending" && !expired && (
                                <>
                                  <button onClick={() => copyInviteLink(inv.token)} style={btn("#f5f0e8","#0d0d0d")}>
                                    {copiedToken === inv.token ? "Copied!" : "Copy Link"}
                                  </button>
                                  <button onClick={() => revokeInvite(inv.token)} style={btn("#c94b2d15","#c94b2d")}>Revoke</button>
                                </>
                              )}
                            </div>
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

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div style={{ maxWidth: 540 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 900, marginBottom: 8 }}>
              Registration Settings
            </h2>
            <p style={{ fontSize: "0.75rem", color: "#9e9589", lineHeight: 1.8, marginBottom: 32 }}>
              Control how new users can join the platform. Changes take effect immediately after saving.
            </p>

            {[
              { key: "openRegistrationEnabled", label: "Open Registration", desc: "Anyone can sign up directly with an email and password." },
              { key: "applicationsEnabled",     label: "Applications",      desc: "Prospective members can submit an application form for review." },
              { key: "invitationsEnabled",       label: "Invitations",       desc: "Admins can generate invite links to onboard specific people." },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div style={{ flex: 1, paddingRight: 24 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#9e9589", lineHeight: 1.6 }}>{desc}</div>
                </div>
                {/* Toggle pill */}
                <div
                  onClick={() => setDraftSettings(s => ({ ...s, [key]: !s[key] }))}
                  style={{
                    width: 44, height: 24, borderRadius: 12, cursor: "pointer", flexShrink: 0,
                    background: draftSettings[key] ? "#5a7a5e" : "rgba(0,0,0,0.15)",
                    position: "relative", transition: "background 0.25s"
                  }}>
                  <div style={{
                    position: "absolute", top: 3, left: draftSettings[key] ? 23 : 3,
                    width: 18, height: 18, borderRadius: "50%", background: "white",
                    transition: "left 0.25s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                  }} />
                </div>
              </div>
            ))}

            {!draftSettings.openRegistrationEnabled && !draftSettings.applicationsEnabled && !draftSettings.invitationsEnabled && (
              <div style={{ background: "#c94b2d12", border: "1px solid #c94b2d30", borderRadius: RADIUS, padding: "12px 16px", marginTop: 20, fontSize: "0.72rem", color: "#c94b2d", lineHeight: 1.6 }}>
                Warning: all registration paths are disabled. New users will be unable to join.
              </div>
            )}

            <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16 }}>
              <button onClick={saveSettings} style={btn("#0d0d0d","#f5f0e8", { padding: "11px 24px" })}>
                Save Settings
              </button>
              {settingsSaved && <span style={{ fontSize: "0.7rem", color: "#5a7a5e" }}>Saved!</span>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
