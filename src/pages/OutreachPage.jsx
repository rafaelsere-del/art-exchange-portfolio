import { useState, useCallback } from "react";

// ── Fonts & Global styles ─────────────────────────────────────────────────────
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f7f5f0; }
  .axia-input {
    width: 100%; padding: 10px 13px;
    border: 1.5px solid rgba(0,0,0,0.13);
    background: #f7f5f0; color: #14120e;
    font-size: 0.82rem; font-family: 'DM Sans', sans-serif;
    outline: none; border-radius: 6px;
    box-sizing: border-box; transition: border-color 0.2s;
  }
  .axia-input:focus { border-color: #b8953a; }
  .axia-btn {
    border: none; cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 0.68rem; letter-spacing: 0.1em; text-transform: uppercase;
    border-radius: 6px; transition: all 0.2s; font-weight: 600;
  }
  .axia-btn-primary {
    background: #14120e; color: #f7f5f0; padding: 10px 20px;
  }
  .axia-btn-primary:hover { background: #2a2620; }
  .axia-btn-ghost {
    background: transparent; color: #6a7260;
    border: 1.5px solid rgba(0,0,0,0.15); padding: 8px 16px;
  }
  .axia-btn-ghost:hover { border-color: #b8953a; color: #b8953a; }
  .axia-btn-gold {
    background: #b8953a; color: #fff; padding: 10px 20px;
  }
  .axia-btn-gold:hover { background: #a07c2a; }
  .card {
    background: white; border-radius: 10px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    overflow: hidden;
  }
  @media (max-width: 600px) {
    .hide-mobile { display: none !important; }
    .stack-mobile { flex-direction: column !important; }
    .full-mobile { width: 100% !important; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const today = () => new Date().toISOString().split("T")[0];
const daysDiff = (d) => d ? Math.floor((Date.now() - new Date(d)) / 86400000) : null;

const STATUS = {
  prospect: { label: "Prospecto",       color: "#6a7260", bg: "#f0ede6", dot: "#9ca891" },
  drafted:  { label: "Borrador listo",  color: "#7c5c2a", bg: "#fdf3e3", dot: "#b8953a" },
  sent:     { label: "Enviado",         color: "#2a5c7a", bg: "#e8f4fa", dot: "#4a9bc4" },
  replied:  { label: "Respondió",       color: "#2a5a3a", bg: "#e8f5ed", dot: "#5a7a5e" },
  joined:   { label: "Se unió ✦",       color: "#7c4a00", bg: "#fff3e0", dot: "#b8953a" },
  pass:     { label: "No interesado",   color: "#7a2a2a", bg: "#fdecea", dot: "#c47a7a" },
};

const INITIAL_ARTISTS = [
  { id: uid(), name: "Marina Vidal", handle: "@marina.vidal.art", type: "emergente", medium: "Pintura / óleo", location: "Buenos Aires", email: "", notes: "Estilo expresionista, muchos retratos femeninos con paleta terrosa.", status: "prospect", contactedAt: null, lastMessage: "", history: [] },
  { id: uid(), name: "Tomás Ferreira", handle: "@tferreira_ceramics", type: "establecido", medium: "Cerámica / escultura", location: "Montevideo", email: "", notes: "Expuesto en 3 galerías regionales. Piezas únicas de alta calidad.", status: "sent", contactedAt: "2026-04-18", lastMessage: "Hola Tomás, te escribo porque sigo tu trabajo...", history: [{ date: "2026-04-18", action: "Mensaje enviado" }] },
];

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaudeSimple(systemPrompt, userPrompt) {
  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  const data = await res.json();
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
}

async function callClaudeWithSearch(systemPrompt, userPrompt) {
  let messages = [{ role: "user", content: userPrompt }];
  const baseBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    tools: [{ type: "web_search_20250305", name: "web_search" }],
  };

  for (let i = 0; i < 8; i++) {
    const res = await fetch("/api/anthropic/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...baseBody, messages }),
    });
    const data = await res.json();
    if (!data.content) throw new Error(JSON.stringify(data));

    const textNow = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
    const toolUseBlocks = data.content.filter(b => b.type === "tool_use");
    if (data.stop_reason === "end_turn" || toolUseBlocks.length === 0) {
      return textNow;
    }

    messages = [...messages, { role: "assistant", content: data.content }];
    const toolResults = toolUseBlocks.map(b => ({
      type: "tool_result",
      tool_use_id: b.id,
      content: "Results will be provided by the search tool.",
    }));
    messages = [...messages, { role: "user", content: toolResults }];
  }
  return "";
}

async function generateMessage(artist, type) {
  const sys = `Sos el fundador de Axia Art, una plataforma de intercambio de obra original entre artistas sin galerías ni dinero — puro trueque entre pares. Tono: cálido, genuino, apasionado por el arte. Español rioplatense informal pero elegante. Sin emojis en exceso. Solo el mensaje, sin saludos extra ni explicaciones.`;
  const prompt = type === "followup"
    ? `Mensaje de seguimiento breve para ${artist.name} (${artist.handle}), artista de ${artist.medium} de ${artist.location}. Le enviamos invitación hace días sin respuesta. Recordale Axia Art con calidez, sin presionar. Máximo 4 oraciones.`
    : `Mensaje de invitación personalizado para ${artist.name} (${artist.handle}), artista ${artist.type} de ${artist.medium} de ${artist.location}. Notas: "${artist.notes}". Invitalo/a a Axia Art. Máximo 6 oraciones.`;
  return callClaudeSimple(sys, prompt);
}

async function searchArtists(criteria) {
  const sys = `Sos un experto en arte contemporáneo. Buscá en internet artistas visuales reales que coincidan con los criterios dados. Luego devolvé ÚNICAMENTE un JSON válido con este formato exacto, sin texto adicional, sin markdown, sin explicaciones:
{"artists":[{"name":"Nombre Apellido","handle":"@handle","type":"emergente","medium":"Pintura al óleo","location":"Ciudad, País","notes":"Descripción breve de su obra","why":"Por qué encaja con Axia Art"}]}
El array debe tener exactamente 5 artistas reales y verificables.`;

  const prompt = `Buscá artistas visuales que coincidan con: "${criteria}"
Axia Art es una plataforma de trueque de obra original entre artistas sin galerías ni dinero. Perfil ideal: artista genuino, obra original, interesado en comunidad.
Devolvé el JSON con 5 artistas.`;

  const raw = await callClaudeWithSearch(sys, prompt);
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON found");
    return JSON.parse(clean.slice(start, end + 1));
  } catch(e) {
    console.error("Parse error:", e, "Raw:", raw);
    return { artists: [] };
  }
}

// ── Brevo Email ───────────────────────────────────────────────────────────────
async function sendEmail(artist, draft) {
  const subject = `Una invitación de Axia Art — intercambiá tu obra sin dinero`;

  const htmlContent = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #14120e; padding: 32px 24px;">
      <div style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.4rem; font-weight: 600; margin-bottom: 24px; color: #b8953a;">
        Axia Art ✦
      </div>
      <div style="white-space: pre-line; line-height: 1.8; font-size: 1rem;">
        ${draft}
      </div>
      <hr style="border: none; border-top: 1px solid #e0ddd6; margin: 32px 0;" />
      <p style="font-size: 11px; color: #9ca891; line-height: 1.6;">
        Axia Art · <a href="https://axiaart.com" style="color: #b8953a;">axiaart.com</a><br/>
        Para dejar de recibir estos mensajes, respondé con "no gracias".
      </p>
    </div>
  `;

  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: artist.email,
      toName: artist.name,
      subject,
      htmlContent,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Error sending email");
  }
  return true;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.prospect;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: "3px 10px", borderRadius: 20,
      fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.06em",
      textTransform: "uppercase", whiteSpace: "nowrap",
      display: "inline-flex", alignItems: "center", gap: 5,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {s.label}
    </span>
  );
}

function FollowUpBadge({ artist }) {
  if (artist.status !== "sent") return null;
  const days = daysDiff(artist.contactedAt);
  if (!days || days < 3) return null;
  return (
    <span style={{
      background: "#fdf3e3", color: "#7c5c2a",
      border: "1px solid #b8953a44",
      padding: "2px 8px", borderRadius: 20,
      fontSize: "0.58rem", fontWeight: 700,
    }}>⏰ {days}d sin respuesta</span>
  );
}

function ArtistRow({ artist, onSelect, isSelected }) {
  return (
    <div
      onClick={() => onSelect(artist.id)}
      style={{
        padding: "14px 16px",
        background: isSelected ? "#fdf8f0" : "white",
        borderLeft: isSelected ? "3px solid #b8953a" : "3px solid transparent",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        cursor: "pointer", transition: "all 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 600, color: "#14120e" }}>
            {artist.name}
          </div>
          <div style={{ fontSize: "0.7rem", color: "#6a7260", marginTop: 1 }}>
            {artist.handle} · {artist.medium}
          </div>
          <div style={{ fontSize: "0.65rem", color: "#9ca891", marginTop: 1 }}>{artist.location}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <StatusBadge status={artist.status} />
          <FollowUpBadge artist={artist} />
        </div>
      </div>
    </div>
  );
}

function SearchPanel({ onAdd, onClose }) {
  const [criteria, setCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState("");

  const search = async () => {
    if (!criteria.trim()) return;
    setLoading(true); setError(""); setResults([]);
    try {
      const data = await searchArtists(criteria);
      if (data.artists?.length > 0) setResults(data.artists);
      else setError("No se encontraron resultados. Intentá con otros criterios.");
    } catch {
      setError("Error buscando. Intentá de nuevo.");
    }
    setLoading(false);
  };

  const toggle = (i) => setSelected(s => {
    const n = new Set(s);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const addSelected = () => {
    results.filter((_, i) => selected.has(i)).forEach(a => {
      onAdd({
        id: uid(), name: a.name, handle: a.handle || "",
        type: a.type || "emergente", medium: a.medium || "",
        location: a.location || "", email: "",
        notes: `${a.notes || ""} ${a.why ? `— ${a.why}` : ""}`.trim(),
        status: "prospect", contactedAt: null, lastMessage: "", history: [],
      });
    });
    onClose();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,18,14,0.6)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      zIndex: 200, padding: "0",
    }}>
      <div style={{
        background: "#f7f5f0", borderRadius: "16px 16px 0 0",
        width: "100%", maxWidth: 640, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid rgba(0,0,0,0.08)", paddingBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 600, color: "#14120e" }}>
                Buscar artistas con IA
              </div>
              <div style={{ fontSize: "0.7rem", color: "#6a7260", marginTop: 2 }}>
                Describe el perfil y el agente busca en internet
              </div>
            </div>
            <button onClick={onClose} className="axia-btn axia-btn-ghost" style={{ padding: "6px 12px" }}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              className="axia-input"
              placeholder='Ej: "Pintores emergentes de América Latina con estilo expresionista" o "Artistas de cerámica en España con presencia en Instagram"'
              value={criteria}
              onChange={e => setCriteria(e.target.value)}
              rows={3}
              style={{ resize: "none", lineHeight: 1.6 }}
            />
          </div>
          <button
            onClick={search}
            disabled={loading || !criteria.trim()}
            className="axia-btn axia-btn-primary"
            style={{ marginTop: 10, width: "100%", padding: "11px", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Buscando en internet..." : "✦ Buscar artistas"}
          </button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {error && <div style={{ color: "#7a2a2a", fontSize: "0.75rem", background: "#fdecea", padding: "10px 14px", borderRadius: 8 }}>{error}</div>}

          {loading && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem", color: "#6a7260", marginBottom: 8 }}>
                Buscando artistas...
              </div>
              <div style={{ fontSize: "0.7rem", color: "#9ca891" }}>Esto puede tomar unos segundos</div>
            </div>
          )}

          {results.length > 0 && (
            <>
              <div style={{ fontSize: "0.65rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                {results.length} artistas encontrados — seleccioná los que querés agregar
              </div>
              {results.map((a, i) => (
                <div
                  key={i}
                  onClick={() => toggle(i)}
                  style={{
                    background: selected.has(i) ? "#fdf8f0" : "white",
                    border: `1.5px solid ${selected.has(i) ? "#b8953a" : "rgba(0,0,0,0.1)"}`,
                    borderRadius: 10, padding: "14px 16px", marginBottom: 10,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem", fontWeight: 600, color: "#14120e" }}>{a.name}</span>
                        <span style={{ fontSize: "0.65rem", color: "#6a7260" }}>{a.handle}</span>
                        <span style={{
                          background: a.type === "establecido" ? "#fdf3e3" : "#e8f5ed",
                          color: a.type === "establecido" ? "#7c5c2a" : "#2a5a3a",
                          padding: "1px 7px", borderRadius: 10, fontSize: "0.58rem", fontWeight: 600,
                        }}>{a.type}</span>
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#6a7260", marginTop: 3 }}>{a.medium} · {a.location}</div>
                      {a.why && <div style={{ fontSize: "0.68rem", color: "#b8953a", marginTop: 5, fontStyle: "italic" }}>"{a.why}"</div>}
                      {a.notes && <div style={{ fontSize: "0.68rem", color: "#9ca891", marginTop: 3 }}>{a.notes}</div>}
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0, marginLeft: 12,
                      background: selected.has(i) ? "#b8953a" : "rgba(0,0,0,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {selected.has(i) && <span style={{ color: "white", fontSize: 12 }}>✓</span>}
                    </div>
                  </div>
                </div>
              ))}

              {selected.size > 0 && (
                <button onClick={addSelected} className="axia-btn axia-btn-gold" style={{ width: "100%", padding: 12, marginTop: 4 }}>
                  Agregar {selected.size} artista{selected.size > 1 ? "s" : ""} al CRM
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddManualModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ name: "", handle: "", type: "emergente", medium: "", location: "", email: "", notes: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(20,18,14,0.6)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200,
    }}>
      <div style={{
        background: "#f7f5f0", borderRadius: "16px 16px 0 0",
        width: "100%", maxWidth: 640, padding: 20,
        boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 600 }}>Agregar artista</div>
          <button onClick={onClose} className="axia-btn axia-btn-ghost" style={{ padding: "6px 12px" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Nombre completo", "name"], ["Handle de Instagram", "handle"], ["Email de contacto", "email"], ["Disciplina / medio", "medium"], ["Ciudad · País", "location"]].map(([label, key]) => (
            <div key={key}>
              <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
              <input className="axia-input" value={form[key]} onChange={e => set(key, e.target.value)} />
            </div>
          ))}
          <div>
            <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Tipo</div>
            <select className="axia-input" value={form.type} onChange={e => set("type", e.target.value)}>
              <option value="emergente">Emergente</option>
              <option value="establecido">Establecido</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Notas</div>
            <textarea className="axia-input" rows={3} style={{ resize: "none", lineHeight: 1.6 }} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={onClose} className="axia-btn axia-btn-ghost" style={{ flex: 1 }}>Cancelar</button>
          <button
            onClick={() => { if (form.name && form.handle) { onAdd({ ...form, id: uid(), status: "prospect", contactedAt: null, lastMessage: "", history: [] }); onClose(); } }}
            className="axia-btn axia-btn-primary"
            style={{ flex: 2 }}
          >Agregar</button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({ artist, onUpdate, onClose }) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [msgType, setMsgType] = useState("invite");
  const [draft, setDraft] = useState(artist.lastMessage || "");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const msg = await generateMessage(artist, msgType);
      setDraft(msg);
      onUpdate(artist.id, { lastMessage: msg, status: artist.status === "prospect" ? "drafted" : artist.status });
    } catch { setDraft("Error. Intentá de nuevo."); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const markSent = () => onUpdate(artist.id, {
    status: "sent", contactedAt: today(),
    history: [...(artist.history || []), { date: today(), action: "Mensaje enviado", msg: draft }],
  });

  const handleSendEmail = async () => {
    if (!artist.email) { setEmailError("Este artista no tiene email cargado."); return; }
    if (!draft) { setEmailError("Generá un mensaje primero."); return; }
    setSending(true); setEmailError("");
    try {
      await sendEmail(artist, draft);
      setEmailSent(true);
      markSent();
      setTimeout(() => setEmailSent(false), 3000);
    } catch (err) {
      setEmailError(err.message || "Error al enviar. Verificá la configuración de Brevo.");
    }
    setSending(false);
  };

  const days = daysDiff(artist.contactedAt);

  return (
    <div style={{ background: "#f7f5f0", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#14120e", padding: "16px 20px", color: "#f7f5f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 600 }}>{artist.name}</div>
            <div style={{ fontSize: "0.7rem", color: "#9ca891", marginTop: 2 }}>{artist.handle} · {artist.medium}</div>
            <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <StatusBadge status={artist.status} />
              {days !== null && <span style={{ fontSize: "0.6rem", color: "#6a7260" }}>contactado hace {days}d</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#6a7260", fontSize: 20, cursor: "pointer", padding: "0 4px" }}>✕</button>
        </div>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Estado */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Actualizar estado</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(STATUS).map(([key, val]) => (
              <button key={key} onClick={() => onUpdate(artist.id, { status: key })} style={{
                background: artist.status === key ? val.bg : "transparent",
                border: `1.5px solid ${artist.status === key ? val.dot : "rgba(0,0,0,0.12)"}`,
                color: artist.status === key ? val.color : "#9ca891",
                borderRadius: 20, padding: "4px 12px", fontSize: "0.62rem",
                cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
              }}>{val.label}</button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Email de contacto</div>
          <input
            className="axia-input"
            placeholder="email@artista.com"
            value={artist.email || ""}
            onChange={e => onUpdate(artist.id, { email: e.target.value })}
            style={{ background: "white" }}
          />
        </div>

        {/* Notas */}
        {artist.notes && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Notas</div>
            <div style={{ fontSize: "0.78rem", color: "#14120e", lineHeight: 1.7 }}>{artist.notes}</div>
          </div>
        )}

        {/* Generador de mensajes */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Generar mensaje con IA</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            {[["invite", "Invitación"], ["followup", "Seguimiento"]].map(([k, l]) => (
              <button key={k} onClick={() => setMsgType(k)} style={{
                background: msgType === k ? "#14120e" : "transparent",
                color: msgType === k ? "#f7f5f0" : "#6a7260",
                border: `1.5px solid ${msgType === k ? "#14120e" : "rgba(0,0,0,0.15)"}`,
                borderRadius: 20, padding: "5px 14px", fontSize: "0.65rem",
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>
          <button onClick={generate} disabled={loading} className="axia-btn axia-btn-gold" style={{ width: "100%", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Generando..." : "✦ Generar mensaje"}
          </button>
        </div>

        {/* Mensaje — siempre visible */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Mensaje</div>
          <textarea
            value={draft}
            onChange={e => { setDraft(e.target.value); onUpdate(artist.id, { lastMessage: e.target.value }); }}
            className="axia-input"
            placeholder="Escribí o generá un mensaje con IA..."
            rows={7}
            style={{ lineHeight: 1.7, resize: "vertical", background: "white" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={copy} disabled={!draft} className="axia-btn axia-btn-ghost" style={{ flex: 1, color: copied ? "#5a7a5e" : undefined, opacity: !draft ? 0.4 : 1 }}>
              {copied ? "✓ Copiado" : "Copiar"}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sending || !artist.email || !draft}
              className="axia-btn axia-btn-gold"
              style={{ flex: 2, opacity: (sending || !artist.email || !draft) ? 0.6 : 1 }}
            >
              {sending ? "Enviando..." : emailSent ? "✓ Enviado" : "✦ Enviar email"}
            </button>
          </div>
          {!artist.email && (
            <div style={{ fontSize: "0.65rem", color: "#9ca891", marginTop: 8, textAlign: "center" }}>
              Cargá el email del artista para poder enviar
            </div>
          )}
          {emailError && (
            <div style={{ fontSize: "0.68rem", color: "#7a2a2a", background: "#fdecea", padding: "8px 12px", borderRadius: 6, marginTop: 8 }}>
              {emailError}
            </div>
          )}
        </div>

        {/* Historial */}
        {artist.history?.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: "0.6rem", color: "#6a7260", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>Historial</div>
            {artist.history.map((h, i) => (
              <div key={i} style={{ borderLeft: "2px solid #e8e4db", paddingLeft: 12, marginBottom: 10 }}>
                <div style={{ fontSize: "0.65rem", color: "#9ca891" }}>{h.date} · {h.action}</div>
                {h.msg && <div style={{ fontSize: "0.7rem", color: "#6a7260", marginTop: 3, lineHeight: 1.5 }}>{h.msg.slice(0, 100)}…</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OutreachPage() {
  const [artists, setArtists] = useState(INITIAL_ARTISTS);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const selected = artists.find(a => a.id === selectedId);
  const updateArtist = useCallback((id, patch) => setArtists(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a)), []);
  const addArtist = (a) => { setArtists(prev => [...prev, a]); };

  const filtered = artists.filter(a => {
    const mf = filter === "all" || a.status === filter;
    const ms = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.handle.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const followUps = artists.filter(a => a.status === "sent" && daysDiff(a.contactedAt) >= 3).length;
  const counts = Object.fromEntries(Object.keys(STATUS).map(k => [k, artists.filter(a => a.status === k).length]));

  const isMobileDetail = selected !== undefined && selected !== null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f7f5f0", minHeight: "100vh" }}>
      <style>{GLOBAL_STYLE}</style>

      {isMobileDetail ? (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <DetailPanel artist={selected} onUpdate={updateArtist} onClose={() => setSelectedId(null)} />
        </div>
      ) : (
        <>
          {/* Header */}
          <div style={{ background: "#14120e", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 600, color: "#f7f5f0" }}>
                  Axia Art
                </div>
                <span style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#6a7260", border: "1px solid #2a2620", padding: "2px 8px", borderRadius: 10 }}>Outreach</span>
              </div>
              <div style={{ fontSize: "0.62rem", color: "#6a7260", marginTop: 2 }}>
                {artists.length} artistas · {counts.joined || 0} unidos
                {followUps > 0 && <span style={{ color: "#b8953a", marginLeft: 8 }}>· ⏰ {followUps} seguimiento{followUps > 1 ? "s" : ""}</span>}
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowAddMenu(v => !v)}
                className="axia-btn axia-btn-gold"
                style={{ padding: "9px 16px" }}
              >+ Agregar</button>
              {showAddMenu && (
                <div style={{
                  position: "absolute", right: 0, top: "calc(100% + 8px)",
                  background: "white", borderRadius: 10, overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 50, minWidth: 180,
                }}>
                  <button onClick={() => { setShowSearch(true); setShowAddMenu(false); }} style={{
                    display: "block", width: "100%", padding: "12px 16px", background: "none",
                    border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.78rem",
                    color: "#14120e", fontFamily: "'DM Sans', sans-serif", borderBottom: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <div style={{ fontWeight: 600 }}>✦ Buscar con IA</div>
                    <div style={{ fontSize: "0.65rem", color: "#6a7260", marginTop: 2 }}>El agente busca en internet</div>
                  </button>
                  <button onClick={() => { setShowAdd(true); setShowAddMenu(false); }} style={{
                    display: "block", width: "100%", padding: "12px 16px", background: "none",
                    border: "none", textAlign: "left", cursor: "pointer", fontSize: "0.78rem",
                    color: "#14120e", fontFamily: "'DM Sans', sans-serif",
                  }}>
                    <div style={{ fontWeight: 600 }}>+ Agregar manualmente</div>
                    <div style={{ fontSize: "0.65rem", color: "#6a7260", marginTop: 2 }}>Ingresá los datos vos</div>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", overflowX: "auto", borderBottom: "1px solid rgba(0,0,0,0.08)", background: "white" }}>
            {[
              { label: "Total", value: artists.length, active: filter === "all", onClick: () => setFilter("all") },
              ...Object.entries(counts).filter(([, v]) => v > 0).map(([k, v]) => ({
                label: STATUS[k].label, value: v, active: filter === k, onClick: () => setFilter(k),
                color: STATUS[k].dot,
              }))
            ].map((s, i) => (
              <button key={i} onClick={s.onClick} style={{
                flexShrink: 0, padding: "12px 16px", background: "none", border: "none",
                borderBottom: s.active ? "2px solid #b8953a" : "2px solid transparent",
                cursor: "pointer", textAlign: "center", transition: "all 0.15s",
              }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.3rem", fontWeight: 600, color: s.active ? "#b8953a" : "#14120e" }}>{s.value}</div>
                <div style={{ fontSize: "0.55rem", color: "#6a7260", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>{s.label}</div>
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: "12px 16px", background: "white", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <input
              className="axia-input"
              placeholder="Buscar por nombre o handle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: "#f7f5f0" }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1 }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.2rem", color: "#6a7260" }}>Sin resultados</div>
                <div style={{ fontSize: "0.72rem", color: "#9ca891", marginTop: 6 }}>Probá con otro filtro o buscá artistas con IA</div>
              </div>
            ) : (
              <div className="card" style={{ margin: "16px", borderRadius: 10, overflow: "hidden" }}>
                {filtered.map(a => (
                  <ArtistRow key={a.id} artist={a} onSelect={setSelectedId} isSelected={selectedId === a.id} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showSearch && (
        <SearchPanel
          onAdd={(a) => addArtist(a)}
          onClose={() => setShowSearch(false)}
        />
      )}
      {showAdd && <AddManualModal onAdd={addArtist} onClose={() => setShowAdd(false)} />}
      {showAddMenu && <div onClick={() => setShowAddMenu(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />}
    </div>
  );
}
