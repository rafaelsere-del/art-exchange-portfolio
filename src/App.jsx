import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import Nav from "./components/Nav";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ApplyPage from "./pages/ApplyPage";
import GalleryPage from "./pages/GalleryPage";
import SwipePage from "./pages/SwipePage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";

const bodyStyle = {
  fontFamily: "'DM Mono', monospace",
  background: "#f5f0e8",
  color: "#0d0d0d",
  minHeight: "100vh",
  overflowX: "hidden"
};

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const updateUser = fn => setUser(u => typeof fn === "function" ? fn(u) : fn);

  const [settings, setSettings] = useState({
    openRegistrationEnabled: true,
    applicationsEnabled: false,
    invitationsEnabled: false
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", "acquisition"))
      .then(snap => { if (snap.exists()) setSettings(snap.data()); })
      .finally(() => setSettingsLoading(false));
  }, []);

  const [inviteToken] = useState(() =>
    new URLSearchParams(window.location.search).get("invite") || null
  );
  const [inviteData, setInviteData] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);

  useEffect(() => {
    if (!inviteToken) return;
    getDoc(doc(db, "invitations", inviteToken)).then(snap => {
      if (!snap.exists()) {
        setInviteData({ valid: false, reason: "not_found" });
        return;
      }
      const d = snap.data();
      const expired = d.expiresAt?.toDate() < new Date();
      setInviteData({
        valid: !expired && d.status === "pending",
        email: d.email,
        reason: expired ? "expired" : d.status === "used" ? "used" : null
      });
    }).finally(() => {
      setInviteLoading(false);
      setPage("auth");
    });
  }, [inviteToken]);

  const handleSetUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      const hasArtworks = newUser.artworks && newUser.artworks.length > 0;
      setPage(hasArtworks ? "swipe" : "gallery");
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <div style={bodyStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 600px) {
          img { max-width: 100%; height: auto; }
          #main-content { padding-bottom: 70px; }
        }
      `}</style>

      {page !== "admin" && <Nav page={page} setPage={setPage} user={user} />}

      <div id="main-content">
        {page === "home"    && <HomePage setPage={setPage} />}
        {page === "auth"    && <AuthPage
                                  setUser={handleSetUser}
                                  setPage={setPage}
                                  settings={settings}
                                  settingsLoading={settingsLoading}
                                  inviteToken={inviteToken}
                                  inviteData={inviteData}
                                  inviteLoading={inviteLoading} />}
        {page === "apply"   && <ApplyPage settings={settings} setPage={setPage} />}
        {page === "gallery" && user && <GalleryPage user={user} setUser={updateUser} />}
        {page === "swipe"   && user && <SwipePage user={user} setUser={updateUser} setPage={setPage} />}
        {page === "matches" && user && <MatchesPage user={user} />}
        {page === "profile" && user && <ProfilePage user={user} setUser={setUser} setPage={setPage} />}
        {page === "admin"   && user && isAdmin && <AdminPage user={user} setPage={setPage} settings={settings} setSettings={setSettings} />}
        {page === "admin"   && user && !isAdmin && <div style={{ padding: "120px 40px", textAlign: "center", color: "#9e9589" }}>Access denied.</div>}
        {!user && !["home","auth","apply"].includes(page) && <AuthPage
                                                                setUser={handleSetUser}
                                                                setPage={setPage}
                                                                settings={settings}
                                                                settingsLoading={settingsLoading}
                                                                inviteToken={inviteToken}
                                                                inviteData={inviteData}
                                                                inviteLoading={inviteLoading} />}
      </div>

      {user && page !== "admin" && <BottomNav page={page} setPage={setPage} user={user} />}
    </div>
  );
}