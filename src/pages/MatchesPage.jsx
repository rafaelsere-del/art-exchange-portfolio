import { useState, useRef, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import ArtSVG from "../components/ArtSVG";
import { RADIUS } from "../styles/theme";

export default function MatchesPage({ user }) {
  const matches = user.matches || [];
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const msgsEndRef = useRef();

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, "matches", activeChat.id, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [activeChat]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMsg = async () => {
    if (!input.trim() || !activeChat) return;
    try {
      await addDoc(collection(db, "matches", activeChat.id, "messages"), {
        text: input.trim(), fromUid: user.uid, fromName: user.name, createdAt: new Date()
      });
      setInput("");
    } catch (err) {
      console.error("Error enviando mensaje:", err);
    }
  };

  // Helper — get the best available image for a match
  const getImage = (art) => art?.imageUrl || null;

  return (
    <div style={{ paddingTop: 80, minHeight: "100vh", padding: "96px 0 0", background: "white" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", padding: "0 40px 40px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "#b8953a", marginBottom: 8 }}>Mutual Interest</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "2.5rem", fontWeight: 600, letterSpacing: "-0.02em" }}>Your <em style={{ color: "#b8953a" }}>Matches</em></h1>
        </div>

        {matches.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#6a7260" }}>
            <div style={{ fontSize: "3rem", marginBottom: 16 }}>⇄</div>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.3rem", fontStyle: "italic", marginBottom: 10 }}>No matches yet</p>
            <p style={{ fontSize: "0.73rem", lineHeight: 1.8 }}>Keep swiping — when another artist wants your work too, you'll both appear here.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: activeChat ? "290px 1fr" : "1fr", gap: 2, background: "rgba(0,0,0,0.07)", borderRadius: RADIUS, overflow: "hidden" }}>

            {/* Match list */}
            <div style={{ background: "#f7f5f0" }}>
              {matches.map(art => (
                <div key={art.id} onClick={() => setActiveChat(art)}
                  style={{ display: "flex", gap: 14, padding: "18px", cursor: "pointer", background: activeChat?.id === art.id ? "#e8e4db" : "transparent", borderLeft: activeChat?.id === art.id ? "3px solid #b8953a" : "3px solid transparent", transition: "background 0.2s" }}>
                  <div style={{ width: 56, height: 56, flexShrink: 0, overflow: "hidden", borderRadius: RADIUS }}>
                    {getImage(art)
                      ? <img src={getImage(art)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <ArtSVG artwork={art} width={56} height={56} />
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "0.92rem", fontWeight: 500 }}>
                      {art.artist || art.title || "Artist"}
                    </div>
                    <div style={{ fontSize: "0.62rem", color: "#6a7260", marginTop: 2 }}>
                      {art.location || ""}
                    </div>
                    <div style={{ fontSize: "0.58rem", color: "#5a7a5e", marginTop: 3 }}>✓ Mutual match</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat panel */}
            {activeChat && (
              <div style={{ background: "white", display: "flex", flexDirection: "column", height: 500 }}>

                {/* Chat header */}
                <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 42, height: 42, overflow: "hidden", flexShrink: 0, borderRadius: RADIUS }}>
                    {getImage(activeChat)
                      ? <img src={getImage(activeChat)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <ArtSVG artwork={activeChat} width={42} height={42} />
                    }
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500 }}>
                      {activeChat.artist || activeChat.title || "Artist"}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "#6a7260" }}>
                      {activeChat.location || ""}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "#5a7a5e", background: "rgba(90,122,94,0.1)", padding: "4px 10px", borderRadius: RADIUS }}>
                    Trade Pending
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.length === 0 && (
                    <div style={{ textAlign: "center", color: "#6a7260", fontSize: "0.7rem", fontStyle: "italic", margin: "auto 0" }}>
                      You matched with {activeChat.artist || "this artist"}.<br />Start the conversation about your trade.
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.fromUid === user.uid;
                    const time = msg.createdAt?.toDate?.()
                      ? msg.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "";
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "72%", padding: "10px 13px", background: isMe ? "#14120e" : "#e8e4db", color: isMe ? "#f7f5f0" : "#14120e", fontSize: "0.78rem", lineHeight: 1.6, borderRadius: RADIUS }}>
                          {!isMe && <div style={{ fontSize: "0.58rem", color: "#6a7260", marginBottom: 3 }}>{msg.fromName}</div>}
                          {msg.text}
                          <div style={{ fontSize: "0.56rem", opacity: 0.5, marginTop: 3, textAlign: "right" }}>{time}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={msgsEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(0,0,0,0.08)", display: "flex", gap: 10 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && sendMsg()}
                    placeholder="Propose the terms of your trade..."
                    style={{ flex: 1, padding: "11px 14px", border: "1.5px solid rgba(0,0,0,0.13)", background: "#f7f5f0", fontSize: "0.78rem", outline: "none", fontFamily: "'DM Sans',monospace", borderRadius: RADIUS }}
                  />
                  <button onClick={sendMsg}
                    style={{ background: "#b8953a", color: "white", padding: "11px 18px", border: "none", cursor: "pointer", fontSize: "0.7rem", letterSpacing: "0.06em", borderRadius: RADIUS }}>
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
