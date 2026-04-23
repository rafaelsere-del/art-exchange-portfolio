import ManifestoGrid from "./components/ManifestoGrid";
import WaitlistForm from "./components/WaitlistForm";

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="logo" style={{ fontFamily: "DM Sans, sans-serif", fontSize: 25 }}>
          AXIA<span className="mark">⇄</span>ART
        </div>
        <nav className="nav" aria-label="Primary">
          <a>Manifesto</a>
          <a>How it works</a>
          <a>Founding cohort</a>
        </nav>
        <a className="join">Join the waitlist</a>
      </header>

      <section className="hero">
        <div className="hero-left">
          <div className="eyebrow">
            <span className="dot" />
            Opening 2026 · Private alpha
          </div>
          <h1 className="headline">
            Where artists<br />become <em>collectors.</em>
          </h1>
          <p className="lede">
            Exchange your work with artists you admire. No galleries. No money. No speculation.
            Just the pure transfer of creative vision between people who understand its value.
          </p>
          <div className="hero-ctas">
            <a className="btn btn-primary">Apply to join →</a>
            <a className="btn btn-ghost">Read the manifesto</a>
          </div>
          <div className="waitlist-meta">
            <span>On the waitlist</span>
            <span className="count">◇ 248 artists</span>
            <span>· 61 collectors</span>
          </div>
        </div>
        <div className="hero-right">
          <div className="art-grid">
            <figure className="art-tile">
              <div className="art-ph art-ph-1"><span>ARTWORK 01</span></div>
              <figcaption>
                <span className="ttl">The portrait of fire</span>
                <span className="who">Rafael Sava</span>
              </figcaption>
            </figure>
            <figure className="art-tile">
              <div className="art-ph art-ph-2"><span>ARTWORK 02</span></div>
              <figcaption>
                <span className="ttl">King in blue</span>
                <span className="who">Rafael Sava</span>
              </figcaption>
            </figure>
            <figure className="art-tile">
              <div className="art-ph art-ph-3"><span>ARTWORK 03</span></div>
              <figcaption>
                <span className="ttl">The wood is changing</span>
                <span className="who">Rafael Sava</span>
              </figcaption>
            </figure>
            <figure className="art-tile">
              <div className="art-ph art-ph-4"><span>ARTWORK 04</span></div>
              <figcaption>
                <span className="ttl">It will come</span>
                <span className="who">Rafael Sava</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <div className="values">
        <div className="val"><span className="k">Artists</span><span className="v">4.2k</span></div>
        <div className="val"><span className="k">Works listed</span><span className="v">1.8k</span></div>
        <div className="val"><span className="k">Exchanges completed</span><span className="v">930+</span></div>
        <div className="val"><span className="k">Countries</span><span className="v">38</span></div>
      </div>

      <section className="block">
        <div className="sec-panel">
          <div className="sec-head">
            <div><h2>Available for exchange</h2></div>
            <a className="link">View all 1,847 works →</a>
          </div>
          <div className="exchange-grid">
            <article className="ex-card">
              <div className="ex-img art-ph-1"><span>ARTWORK</span></div>
              <div className="ex-meta">
                <div className="ex-cat">Acrylic on canvas · 120×90 cm</div>
                <h4>The world is changing</h4>
                <div className="ex-artist">Rafael Sava</div>
                <div className="ex-row">
                  <span>Seeking: open exchange</span>
                  <button className="ex-btn">Offer exchange</button>
                </div>
              </div>
            </article>
            <article className="ex-card">
              <div className="ex-img art-ph-3"><span>ARTWORK</span></div>
              <div className="ex-meta">
                <div className="ex-cat">Acrylic · 80×60 cm</div>
                <h4>It will come</h4>
                <div className="ex-artist">Rafael Sava</div>
                <div className="ex-row">
                  <span>Seeking: open exchange</span>
                  <button className="ex-btn">Offer exchange</button>
                </div>
              </div>
            </article>
            <article className="ex-card">
              <div className="ex-img art-ph-4"><span>ARTWORK</span></div>
              <div className="ex-meta">
                <div className="ex-cat">Oil · landscape · 2023</div>
                <h4>Iris</h4>
                <div className="ex-artist">Pedro Bianco</div>
                <div className="ex-row">
                  <span>Seeking: open exchange</span>
                  <button className="ex-btn">Offer exchange</button>
                </div>
              </div>
            </article>
            <article className="ex-card">
              <div className="ex-img art-ph-2"><span>ARTWORK</span></div>
              <div className="ex-meta">
                <div className="ex-cat">Oil · abstract · 2021</div>
                <h4>Azul</h4>
                <div className="ex-artist">Vita Piontek</div>
                <div className="ex-row">
                  <span>Seeking: open exchange</span>
                  <button className="ex-btn">Offer exchange</button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <ManifestoGrid />

      <section className="moves">
        <h2>Four moves. One exchange.</h2>
        <div className="lede">The ritual from listing to collecting</div>
        <div className="moves-grid">
          <div className="mv-step">
            <div className="num">01</div>
            <div className="icon">↗</div>
            <h4>List your work</h4>
            <p>Upload works you&apos;re willing to trade. Photos, paintings, sculpture, digital — if you made it, it belongs here.</p>
          </div>
          <div className="mv-step">
            <div className="num">02</div>
            <div className="icon">◇</div>
            <h4>Discover &amp; care</h4>
            <p>Browse works from artists around the world. Save the ones that move you. Take your time — this is about genuine connection.</p>
          </div>
          <div className="mv-step">
            <div className="num">03</div>
            <div className="icon">⇄</div>
            <h4>Propose an exchange</h4>
            <p>Offer one of your works for theirs. Chat directly. No intermediaries, no platform fees. Just two artists agreeing on value.</p>
          </div>
          <div className="mv-step">
            <div className="num">04</div>
            <div className="icon">⌂</div>
            <h4>Ship &amp; collect</h4>
            <p>Exchange your pieces. You&apos;re now an artist-collector — chosen by another artist who sees value in yours.</p>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="letter">
          <div className="lhs">
            <div className="seal">A</div>
            <div className="label">◇ Letter from the founder</div>
            <h3>Why we&apos;re starting small, on purpose.</h3>
          </div>
          <div className="rhs">
            <p>I&apos;m building Axia because I&apos;m tired of watching artists hand half their income to galleries, and watching collectors pretend art is an asset class.</p>
            <p>For now, it&apos;s just <em>me and my studio.</em> The works you&apos;d see here are mine. I&apos;d rather show you an honest empty room than fake a crowd.</p>
            <p>If the idea resonates, join the waitlist. When we open, we&apos;ll let in <em>thirty artists</em> as a founding cohort. Small, deliberate, real.</p>
            <div className="sign">— Rafael</div>
            <div className="sign-name">Rafael Sava · Founder, Axia Art</div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="sec-panel">
          <div className="sec-head">
            <div><h2>Artists on Axia</h2></div>
            <a className="link">Meet all artists →</a>
          </div>
          <div className="artists-row">
            <div className="ar-card">
              <div className="ar-tile">PJ</div>
              <div className="ar-meta">
                <h4>Paula Jordana</h4>
                <span className="loc">Bucharest, Romania</span>
                <span className="cnt">3 works listed</span>
              </div>
            </div>
            <div className="ar-card">
              <div className="ar-tile">AP</div>
              <div className="ar-meta">
                <h4>Andrei Popescu</h4>
                <span className="loc">Montevideo, Uruguay</span>
                <span className="cnt">2 works listed</span>
              </div>
            </div>
            <div className="ar-card">
              <div className="ar-tile">LB</div>
              <div className="ar-meta">
                <h4>Luca Bianchi</h4>
                <span className="loc">Torino, Italy</span>
                <span className="cnt">4 works listed</span>
              </div>
            </div>
            <div className="ar-card">
              <div className="ar-tile">SM</div>
              <div className="ar-meta">
                <h4>Stefan Müller</h4>
                <span className="loc">Vienna, Austria</span>
                <span className="cnt">2 works listed</span>
              </div>
            </div>
            <div className="ar-card">
              <div className="ar-tile img" />
              <div className="ar-meta">
                <h4>Rafael Sava</h4>
                <span className="loc">Lisbon, Portugal</span>
                <span className="cnt">7 works listed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="waitlist-cta">
        <div className="eb">◇ Founding cohort · 30 artists · opening 2026</div>
        <h2>Join the <em>waitlist.</em></h2>
        <div className="p">We&apos;ll write to you when we open, and never before. No newsletter, no drip, no noise. One letter, one invitation.</div>
        <WaitlistForm />
      </section>

      <footer className="site-footer">
        <div className="logo">
          AXIA<span style={{ color: "var(--gold)", margin: "0 .5em" }}>⇄</span>ART
        </div>
        <div className="fmid">Where artists become collectors · Pure exchange of creative vision</div>
        <div className="fnav">
          <a>About</a>
          <a>Privacy</a>
          <a>Terms</a>
          <a>Contact</a>
        </div>
      </footer>
    </>
  );
}