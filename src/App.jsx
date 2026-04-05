import { useState } from "react";
import Nav from "./components/Nav";
import BottomNav from "./components/BottomNav";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import GalleryPage from "./pages/GalleryPage";
import SwipePage from "./pages/SwipePage";
import MatchesPage from "./pages/MatchesPage";
import ProfilePage from "./pages/ProfilePage";

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

  // When user logs in, decide initial page based on artworks
  const handleSetUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      const hasArtworks = newUser.artworks && newUser.artworks.length > 0;
      setPage(hasArtworks ? "swipe" : "gallery");
    }
  };

  return (
    <div style={bodyStyle}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 600px) {
          img { max-width: 100%; height: auto; }
          /* Add bottom padding so content isn't hidden behind BottomNav */
          #main-content { padding-bottom: 70px; }
        }
      `}</style>

      <Nav page={page} setPage={setPage} user={user} />

      <div id="main-content">
        {page === "home"    && <HomePage setPage={setPage} />}
        {page === "auth"    && <AuthPage setUser={handleSetUser} setPage={setPage} />}
        {page === "gallery" && user && <GalleryPage user={user} setUser={updateUser} />}
        {page === "swipe"   && user && <SwipePage user={user} setUser={updateUser} setPage={setPage} />}
        {page === "matches" && user && <MatchesPage user={user} />}
        {page === "profile" && user && <ProfilePage user={user} setUser={setUser} setPage={setPage} />}
        {!user && !["home","auth"].includes(page) && <AuthPage setUser={handleSetUser} setPage={setPage} />}
      </div>

      {/* Bottom nav — only shown when logged in, hidden on desktop via CSS */}
      {user && <BottomNav page={page} setPage={setPage} user={user} />}
    </div>
  );
}
