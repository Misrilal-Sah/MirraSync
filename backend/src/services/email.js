// Email service using Brevo (Sendinblue) HTTP API
// Uses Node 20's built-in fetch — no extra npm packages required

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const FROM_NAME = process.env.SMTP_FROM_NAME || 'MirraSync';
const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'misrilalsah09@gmail.com';

async function sendEmail({ to, toName, subject, html, text }) {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: FROM_NAME, email: FROM_EMAIL },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error ${response.status}: ${err.message || JSON.stringify(err)}`);
  }
}

function getBaseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>MirraSync</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0f;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#111118;border-radius:16px;border:1px solid #2a2a3a;overflow:hidden;">
      <!-- Header -->
      <tr>
        <td style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #2a2a3a;">
          <div style="display:inline-block;">
            <img src="https://res.cloudinary.com/ddrlxvnsh/image/upload/v1774035263/logo_k2bhoz_k21hch.png" alt="MirraSync" width="36" height="36" style="border-radius:50%;vertical-align:middle;margin-right:10px;" />
            <span style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#00d4aa,#0ea5e9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;letter-spacing:-0.5px;vertical-align:middle;">MirraSync</span>
          </div>
          <div style="height:3px;background:linear-gradient(90deg,#00d4aa,#0ea5e9,#7c3aed);border-radius:2px;margin-top:12px;"></div>
        </td>
      </tr>
      <!-- Content -->
      <tr><td style="padding:40px;">${content}</td></tr>
      <!-- Footer -->
      <tr>
        <td style="padding:24px 40px;border-top:1px solid #2a2a3a;text-align:center;">
          <p style="color:#606080;font-size:12px;margin:0 0 8px;">© ${new Date().getFullYear()} MirraSync · Sync Every Mind. One Prompt.</p>
          <p style="color:#606080;font-size:12px;margin:0;">If you have questions, contact us at <a href="mailto:${FROM_EMAIL}" style="color:#00d4aa;text-decoration:none;">${FROM_EMAIL}</a></p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function getOtpEmailHtml(otp, name) {
  const content = `
    <h1 style="color:#f0f0ff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">Verify your email address</h1>
    <p style="color:#a0a0c0;font-size:15px;text-align:center;margin:0 0 32px;">Hi ${name}! Enter this code in MirraSync to activate your account.</p>
    
    <div style="text-align:center;margin:0 0 32px;">
      <div style="display:inline-block;background-color:#1a1a24;border:2px solid #00d4aa;border-radius:12px;padding:24px 40px;box-shadow:0 0 30px rgba(0,212,170,0.15);">
        <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#00d4aa;font-family:'Courier New',monospace;">${otp}</span>
      </div>
    </div>
    
    <div style="background-color:#1a1a24;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="color:#f59e0b;font-size:13px;margin:0;">⏰ This code expires in <strong>10 minutes</strong></p>
    </div>
    
    <p style="color:#606080;font-size:13px;text-align:center;margin:0;">If you didn't create a MirraSync account, you can safely ignore this email.</p>
  `;
  return getBaseTemplate(content);
}

function getPasswordResetEmailHtml(resetUrl, name) {
  const content = `
    <h1 style="color:#f0f0ff;font-size:24px;font-weight:700;margin:0 0 8px;text-align:center;">Reset your password</h1>
    <p style="color:#a0a0c0;font-size:15px;text-align:center;margin:0 0 32px;">Hi ${name}! We received a request to reset the password for your MirraSync account.</p>
    
    <div style="text-align:center;margin:0 0 32px;">
      <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#00d4aa,#0ea5e9);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.3px;">Reset My Password</a>
    </div>
    
    <div style="background-color:#1a1a24;border-radius:10px;padding:16px;margin-bottom:24px;text-align:center;">
      <p style="color:#f59e0b;font-size:13px;margin:0;">⏰ This link expires in <strong>15 minutes</strong></p>
    </div>
    
    <p style="color:#606080;font-size:12px;text-align:center;margin:0 0 8px;">Or copy and paste this URL into your browser:</p>
    <p style="color:#00d4aa;font-size:11px;text-align:center;word-break:break-all;margin:0 0 24px;">${resetUrl}</p>
    
    <p style="color:#606080;font-size:13px;text-align:center;margin:0;">If you didn't request a password reset, please ignore this email. Your password will not be changed.</p>
  `;
  return getBaseTemplate(content);
}

async function sendOtpEmail(email, name, otp) {
  await sendEmail({
    to: email,
    toName: name,
    subject: `${otp} — Your MirraSync verification code`,
    html: getOtpEmailHtml(otp, name),
    text: `Your MirraSync verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't create a MirraSync account, ignore this email.`,
  });
}

async function sendPasswordResetEmail(email, name, resetUrl) {
  await sendEmail({
    to: email,
    toName: name,
    subject: 'Reset your MirraSync password',
    html: getPasswordResetEmailHtml(resetUrl, name),
    text: `Reset your MirraSync password by visiting:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request a password reset, ignore this email.`,
  });
}

module.exports = { sendOtpEmail, sendPasswordResetEmail };
