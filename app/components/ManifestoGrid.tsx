"use client";

import { useState } from "react";

type Variation = "manifesto" | "founder" | "movements" | "criteria";

const VARIATIONS: Record<Variation, { sub: string; title: string; html: string }> = {
  manifesto: {
    sub: "◇ Manifesto · The four tenets",
    title: "What Axia stands for.",
    html: `
      <div class="grid-manifesto">
        <div class="mfs-card">
          <div class="topline"><span class="n">I.</span><span class="tag">Refusal</span></div>
          <div class="big">No<br/><strong>galleries.</strong></div>
          <div class="caption">The 50% commission is not inevitable. It's a habit we've decided to break.</div>
        </div>
        <div class="mfs-card inverse">
          <div class="topline"><span class="n">II.</span><span class="tag">Refusal</span></div>
          <div class="big">No<br/><strong>money.</strong></div>
          <div class="caption">Price flattens art into asset. We exchange work for work — an older, truer economy.</div>
        </div>
        <div class="mfs-card">
          <div class="topline"><span class="n">III.</span><span class="tag">Refusal</span></div>
          <div class="big">No<br/><strong>speculation.</strong></div>
          <div class="caption">Pieces here are collected by people who make things. Not by portfolios.</div>
        </div>
        <div class="mfs-card paper">
          <div class="topline"><span class="n">IV.</span><span class="tag">Affirmation</span></div>
          <div class="big">Just<br/><strong>exchange.</strong></div>
          <div class="caption">Two artists. Two works. A letter, a handshake, a shipment. The original transaction.</div>
        </div>
      </div>`,
  },
  founder: {
    sub: "◇ The founding works · From the studio of Rafael Sava",
    title: "We're starting with what we have.",
    html: `
      <div class="grid-founder">
        <div class="fnd-feature">
          <div class="ph"><span>Studio work · 120 × 90 cm · Oil on linen</span></div>
          <div class="meta">◇ Founding work · 001</div>
          <h3>The weight of the afternoon</h3>
          <p>Made in the same studio where Axia was dreamt up. Available for exchange once we open — to an artist who makes something I'd hang on my own wall.</p>
        </div>
        <div class="fnd-side">
          <div class="fnd-card">
            <div class="ph"><span>Work · 40 × 50 cm</span></div>
            <div class="m">◇ Founding 002</div>
            <h4>Room, unfinished</h4>
          </div>
          <div class="fnd-card">
            <div class="ph"><span>Work · 60 × 45 cm</span></div>
            <div class="m">◇ Founding 003</div>
            <h4>Blue hour study</h4>
          </div>
        </div>
        <div class="fnd-side">
          <div class="fnd-card">
            <div class="ph"><span>Work · 30 × 30 cm</span></div>
            <div class="m">◇ Founding 004</div>
            <h4>Untitled (pines)</h4>
          </div>
          <div class="fnd-card">
            <div class="ph"><span>Work · 80 × 60 cm</span></div>
            <div class="m">◇ Founding 005</div>
            <h4>The neighbour's dog</h4>
          </div>
        </div>
        <div class="fnd-note">
          <div>
            <div class="kicker">◇ From the founder</div>
            <p>"Until more artists join us, the only works on display are mine. These will be exchanged with our first thirty members."</p>
          </div>
          <div class="sig">— Rafael</div>
        </div>
      </div>`,
  },
  movements: {
    sub: "◇ Fieldnotes · What we're drawn to",
    title: "Movements we're carrying forward.",
    html: `
      <div class="grid-movements">
        <div class="mv-card">
          <div class="mv-swatch mv-1"><span class="era">1948 · Europe</span></div>
          <div class="mv-body">
            <h4>CoBrA</h4>
            <div class="by">◇ Spontaneity · Anti-institution</div>
            <p>Artists exchanging paintings between Copenhagen, Brussels, Amsterdam. An unauthorized economy of friendship.</p>
          </div>
        </div>
        <div class="mv-card">
          <div class="mv-swatch mv-2"><span class="era">1957 · Paris</span></div>
          <div class="mv-body">
            <h4>Situationist barter</h4>
            <div class="by">◇ Circulation · Refusal</div>
            <p>Works traded rather than sold. The art object as a provocation, not a commodity.</p>
          </div>
        </div>
        <div class="mv-card">
          <div class="mv-swatch mv-3"><span class="era">1920s · Bauhaus</span></div>
          <div class="mv-body">
            <h4>The teacher's wall</h4>
            <div class="by">◇ Community · Reciprocity</div>
            <p>Klee and Kandinsky swapped paintings each Christmas. Every Bauhaus master's home held other masters' work.</p>
          </div>
        </div>
        <div class="mv-card">
          <div class="mv-swatch mv-4"><span class="era">Forever · Everywhere</span></div>
          <div class="mv-body">
            <h4>Studio trades</h4>
            <div class="by">◇ Pre-market · Private</div>
            <p>The oldest art economy. Every artist has one work by a friend they love more than any they ever bought.</p>
          </div>
        </div>
      </div>`,
  },
  criteria: {
    sub: "◇ House rules · What belongs here",
    title: "What counts as art on Axia.",
    html: `
      <div class="grid-criteria">
        <div class="cr-row">
          <div class="n">01</div>
          <div>
            <h4>Made by hand, or by hand-guided machine.</h4>
            <p>Paintings, photographs, ceramics, prints, sculpture, textiles, digital work with real authorship behind it.</p>
          </div>
          <div class="yn">yes</div>
        </div>
        <div class="cr-row">
          <div class="n">02</div>
          <div>
            <h4>Editions of one, or small &amp; signed.</h4>
            <p>Unique works first. Editions capped at 25 and signed by the artist. No open-run prints.</p>
          </div>
          <div class="yn">yes</div>
        </div>
        <div class="cr-row">
          <div class="n">03</div>
          <div>
            <h4><s>Generative AI output, unaltered.</s></h4>
            <p>Prompt-only work without hand revision. The platform is for work an artist made, not a model produced.</p>
          </div>
          <div class="yn no">no</div>
        </div>
        <div class="cr-row">
          <div class="n">04</div>
          <div>
            <h4><s>NFTs as speculation.</s></h4>
            <p>We have no opinion on digital objects, but we won't host works listed primarily as financial instruments.</p>
          </div>
          <div class="yn no">no</div>
        </div>
        <div class="cr-row">
          <div class="n">05</div>
          <div>
            <h4>Work you'd be proud to trade.</h4>
            <p>If you wouldn't hang it in another artist's home, it doesn't belong here. This is the only real filter.</p>
          </div>
          <div class="yn">yes</div>
        </div>
        <div class="cr-row">
          <div class="n">06</div>
          <div>
            <h4><s>Resale listings.</s></h4>
            <p>Works acquired through Axia stay with the collector. If you need to pass one on, we'll help — for free, once.</p>
          </div>
          <div class="yn no">no</div>
        </div>
      </div>`,
  },
};

export default function ManifestoGrid() {
  const [variation, setVariation] = useState<Variation>("manifesto");
  const [panelOpen, setPanelOpen] = useState(false);
  const current = VARIATIONS[variation];

  return (
    <>
      <section className="block">
        <div className="sec-panel">
          <div className="sec-head">
            <div>
              <div className="sub">{current.sub}</div>
              <h2>{current.title}</h2>
            </div>
            <a className="link">Read the full manifesto →</a>
          </div>
          <div dangerouslySetInnerHTML={{ __html: current.html }} />
        </div>
      </section>

      <button className="tweaks-fab" onClick={() => setPanelOpen((o) => !o)}>
        ◇ Tweaks
      </button>

      {panelOpen && (
        <div className="tweaks-panel">
          <h4>Artwork grid</h4>
          <div className="tweak-sub">◇ Empty-state variations</div>
          <div className="tweak-group">
            <div className="tweak-label">Which content replaces the empty works grid?</div>
            <div className="tweak-opts">
              {(["manifesto", "founder", "movements", "criteria"] as Variation[]).map((v) => (
                <button
                  key={v}
                  className={variation === v ? "active" : ""}
                  onClick={() => setVariation(v)}
                >
                  {v === "manifesto" && "A · Manifesto"}
                  {v === "founder" && "B · Founder's works"}
                  {v === "movements" && "C · Movements"}
                  {v === "criteria" && "D · What counts"}
                </button>
              ))}
            </div>
          </div>
          <div className="tweak-note">
            Until you have real artists + works, the grid stays concept-forward. Swap anytime.
          </div>
        </div>
      )}
    </>
  );
}