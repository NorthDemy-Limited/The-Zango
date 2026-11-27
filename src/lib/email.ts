import nodemailer from "nodemailer";

export interface SendStaffWelcomeEmailParams {
  to: string;
  name: string;
  username: string;
  defaultPassword: string;
  role: string;
  desk: string;
  portalUrl?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Builds an official, branded HTML email template for newly provisioned newsroom staff
 */
function buildWelcomeHtmlTemplate(params: SendStaffWelcomeEmailParams): string {
  const { name, username, defaultPassword, role, desk, portalUrl = "https://thezango.com/login" } = params;
  const roleDisplay =
    role === "admin"
      ? "Chief Administrator"
      : role === "editor"
      ? "Desk Editor"
      : "Staff Writer / Author";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Zango Newsroom Clearance</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: #c61d1f;
      padding: 32px 28px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
      letter-spacing: 0.02em;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #0f172a;
    }
    .intro {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 24px;
    }
    .credentials-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .cred-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 8px;
    }
    .cred-row:last-child {
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .cred-label {
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    .cred-value {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-weight: 700;
      color: #0f172a;
    }
    .highlight-cred {
      color: #c61d1f;
      font-size: 15px;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px 0;
    }
    .cta-button {
      display: inline-block;
      background: #c61d1f;
      color: #ffffff !important;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(198, 29, 31, 0.3);
    }
    .notice {
      font-size: 12px;
      line-height: 1.5;
      color: #64748b;
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 28px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>THE ZANGO</h1>
      <p>Editorial Bureau & Investigative Newsroom Clearance</p>
    </div>
    <div class="content">
      <div class="greeting">Assalamu Alaikum, ${name}</div>
      <div class="intro">
        An official staff profile has been provisioned for you at <strong>The Zango</strong> newsroom. You have been cleared for editorial operations under the <strong>${desk}</strong> desk.
      </div>

      <div class="credentials-box">
        <div class="cred-row">
          <span class="cred-label">Clearance Role</span>
          <span class="cred-value">${roleDisplay}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Desk / Beat</span>
          <span class="cred-value">${desk}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Login Username</span>
          <span class="cred-value highlight-cred">${username}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Passcode</span>
          <span class="cred-value highlight-cred">${defaultPassword}</span>
        </div>
      </div>

      <div class="notice">
        <strong>Security Directive:</strong> You are strictly advised to navigate to the <strong>Settings</strong> tab in your dashboard upon your first sign-in to update your password to a private passphrase.
      </div>

      <div class="cta-container">
        <a href="${portalUrl}" class="cta-button">Sign In to Newsroom Terminal &rarr;</a>
      </div>
    </div>
    <div class="footer">
      This transmission was generated by The Zango Newsroom Administration.<br>
      Confidential editorial communication. If you received this in error, notify inquiry@thezango.com.
    </div>
  </div>
</body>
</html>
  `.trim();
}

async function dispatchEmailWithFallback(params: {
  to: string;
  name: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  username: string;
  defaultPassword: string;
}): Promise<EmailDispatchResult> {
  const { to, name, subject, textContent, htmlContent, username, defaultPassword } = params;
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || '"The Zango Bureau" <inquiry@thezango.com>';

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.info(`[Email Dispatch] Email successfully dispatched to ${to} (Message ID: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        simulated: false,
      };
    } catch (err: unknown) {
      console.warn("[Email Dispatch] SMTP dispatch failed, falling back to simulation:", err);
    }
  }

  console.info(`
========================================================================
[MOCK/DEV EMAIL DISPATCHER]
To: ${to} (${name})
Subject: ${subject}
Login Username: ${username}
Temporary Password: ${defaultPassword}
Status: Recorded for immediate testing & administrative confirmation.
========================================================================
  `);

  return {
    success: true,
    simulated: true,
  };
}

/**
 * Dispatches an automated onboarding email containing username and temporary passcode.
 */
export async function sendStaffWelcomeEmail(params: SendStaffWelcomeEmailParams): Promise<EmailDispatchResult> {
  const { to, name, username, defaultPassword } = params;
  const htmlContent = buildWelcomeHtmlTemplate(params);
  const textContent = `
Assalamu Alaikum ${name},

Your newsroom clearance for The Zango has been provisioned.

- Username: ${username}
- Temporary Passcode: ${defaultPassword}
- Desk: ${params.desk}
- Portal URL: ${params.portalUrl || "https://thezango.com/login"}

Please log in and update your password in your Settings tab.
  `.trim();

  return dispatchEmailWithFallback({
    to,
    name,
    subject: `[The Zango Bureau] Newsroom Clearance & Credentials: ${username}`,
    textContent,
    htmlContent,
    username,
    defaultPassword,
  });
}

/**
 * Dispatches a password reset email with a newly generated temporary passcode.
 */
export async function sendStaffPasswordResetEmail(
  params: SendStaffWelcomeEmailParams
): Promise<EmailDispatchResult> {
  const { to, name, username, defaultPassword, desk, portalUrl = "https://thezango.com/login" } = params;
  const htmlContent = buildWelcomeHtmlTemplate(params).replace(
    "Your newsroom clearance has been provisioned by the Bureau Chief",
    "Your newsroom clearance passcode has been reset by the Bureau Chief"
  );
  const textContent = `
Assalamu Alaikum ${name},

Your newsroom clearance passcode for The Zango has been reset by an administrator.

- Username: ${username}
- New Temporary Passcode: ${defaultPassword}
- Desk: ${desk}
- Portal URL: ${portalUrl}

Please sign in and update your password in your Settings tab.
  `.trim();

  return dispatchEmailWithFallback({
    to,
    name,
    subject: `[The Zango Bureau] Passcode Reset & New Credentials: ${username}`,
    textContent,
    htmlContent,
    username,
    defaultPassword,
  });
}

