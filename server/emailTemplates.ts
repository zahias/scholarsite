// Shared HTML wrapper for transactional emails, matching the Scholar.name brand
// (navy #0B1F3A, gold #FFC72E). Kept as inline-styled tables/divs since email
// clients strip <style> blocks and modern CSS unpredictably.

interface EmailTemplateOptions {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}

export function renderEmailHtml({ preheader, heading, bodyHtml, ctaLabel, ctaUrl, footerNote }: EmailTemplateOptions): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background-color:#F0F4F8; font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F0F4F8; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 24px 60px -20px rgba(11,31,58,.18);">
          <tr>
            <td style="background-color:#0B1F3A; padding:28px 32px; text-align:center;">
              <span style="display:inline-block; width:32px; height:32px; background-color:#0B1F3A; border:1px solid rgba(255,199,46,.4); border-radius:9px; color:#FFC72E; font-family:Georgia,serif; font-style:italic; font-weight:700; font-size:16px; line-height:32px; text-align:center;">S</span>
              <span style="color:#ffffff; font-family:Georgia,serif; font-size:18px; font-weight:700; margin-left:10px; vertical-align:middle;">Scholar.name</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 8px;">
              <h1 style="margin:0 0 16px; font-family:Georgia,'Times New Roman',serif; font-size:22px; font-weight:600; color:#0B1F3A;">${escapeHtml(heading)}</h1>
              <div style="font-family:Arial,Helvetica,sans-serif; font-size:14.5px; line-height:1.6; color:#44474D;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          ${ctaLabel && ctaUrl ? `
          <tr>
            <td style="padding:8px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:9px; background-color:#FFC72E;">
                    <a href="${escapeHtmlAttr(ctaUrl)}" style="display:inline-block; padding:12px 28px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:700; color:#6F5400; text-decoration:none;">${escapeHtml(ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:20px 32px 28px; border-top:1px solid rgba(11,31,58,.08);">
              <p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#75777E;">${footerNote ? escapeHtml(footerNote) + " " : ""}The Scholar.name team</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlAttr(value: string): string {
  // URLs specifically: escape for safe use inside an href="..." attribute
  return escapeHtml(value);
}
