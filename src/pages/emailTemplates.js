// ── Axia Art Email Templates ──────────────────────────────────────────────────
// Agregá nuevos templates como funciones que reciben { artistName, message }
// y devuelven un string HTML listo para enviar via Brevo.

export function templateInvitacion({ artistName, message }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Axia Art — Invitación</title>
</head>
<body style="margin:0;padding:0;background-color:#f7f5f0;font-family:Georgia,'Times New Roman',serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f5f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#14120e;padding:28px 40px 24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:22px;font-weight:400;letter-spacing:0.18em;color:#f7f5f0;text-transform:uppercase;">
                    AXIA
                  </td>
                  <td style="padding:0 10px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="font-family:Georgia,serif;font-size:13px;color:#b8953a;line-height:1;padding-bottom:1px;">&#8594;</td></tr>
                      <tr><td align="center" style="font-family:Georgia,serif;font-size:13px;color:#b8953a;line-height:1;padding-top:1px;">&#8592;</td></tr>
                    </table>
                  </td>
                  <td style="font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:22px;font-weight:400;letter-spacing:0.18em;color:#f7f5f0;text-transform:uppercase;">
                    ART
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#6a7260;">
                Arte que se intercambia. Sin galerías. Sin dinero.
              </p>
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="background-color:#b8953a;height:2px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 32px;">
              <p style="margin:0 0 24px;font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:26px;font-weight:400;color:#14120e;line-height:1.3;">
                Una invitación<br/>
                <em style="color:#b8953a;">para vos.</em>
              </p>
              <p style="margin:0 0 20px;font-family:Georgia,serif;font-size:15px;color:#3a3630;line-height:1.85;white-space:pre-line;">
                ${message}
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:32px 0 0;">
                <tr>
                  <td style="background-color:#14120e;border-radius:4px;">
                    <a href="https://axiaart.com" style="display:inline-block;padding:14px 32px;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:#f7f5f0;text-decoration:none;">
                      Ver Axia Art &#8594;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MANIFESTO STRIP -->
          <tr>
            <td style="background-color:#1e2a1a;padding:24px 40px;">
              <p style="margin:0;font-family:'Palatino Linotype',Palatino,Georgia,serif;font-size:13px;font-style:italic;color:#9ca891;line-height:1.7;">
                "The real value of art — not as a market, not as a career ladder.<br/>
                As the force it actually is."
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f7f5f0;padding:24px 40px;border-top:1px solid #e8e4db;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:#9ca891;">
                      Axia Art &nbsp;·&nbsp;
                      <a href="https://axiaart.com" style="color:#b8953a;text-decoration:none;">axiaart.com</a>
                    </p>
                    <p style="margin:6px 0 0;font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:10px;color:#b8b4ac;line-height:1.6;">
                      Recibiste este mensaje porque tu obra llamó nuestra atención.<br/>
                      Para no recibir más invitaciones, respondé con "no gracias".
                    </p>
                  </td>
                  <td align="right" valign="top">
                    <table cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="font-family:Georgia,serif;font-size:10px;color:#b8953a;line-height:1;">&#8594;</td></tr>
                      <tr><td align="center" style="font-family:Georgia,serif;font-size:10px;color:#b8953a;line-height:1;">&#8592;</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Futuro: agregá más templates aquí ────────────────────────────────────────
// export function templateSeguimiento({ artistName, message }) { ... }
// export function templateBienvenida({ artistName, message }) { ... }
