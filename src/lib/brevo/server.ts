import "server-only";

export interface BrevoEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
}

type BrevoEnv = Record<string, string | undefined>;

export function isBrevoConfigured(env: BrevoEnv = process.env): boolean {
  return Boolean(env.BREVO_API_KEY?.trim() && env.BREVO_SENDER_EMAIL?.trim());
}

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://khadeejaempire.com").replace(/\/$/, "");
}

function emailShell(bodyHtml: string, options: { center?: boolean } = {}): string {
  const siteUrl = siteBaseUrl();
  const logoUrl = `${siteUrl}/assets/logo.png`;
  const displayUrl = siteUrl.replace(/^https?:\/\//, "");
  const bodyAlign = options.center ? "text-align:center;" : "";
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f6ede0;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6ede0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e5dfd3;">
            <tr>
              <td style="background-color:#2d2016;padding:32px;text-align:center;">
                <img src="${logoUrl}" alt="Khadeeja Empire" width="92" style="display:block;margin:0 auto;max-width:92px;height:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px;color:#2d2520;font-size:15px;line-height:1.7;${bodyAlign}">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#faf6f0;padding:20px 32px;text-align:center;border-top:1px solid #e5dfd3;">
                <p style="margin:0;font-size:12px;color:#8a7a68;">Khadeeja Empire — Handloom sarees, handwoven in Banaras.</p>
                <p style="margin:6px 0 0;font-size:12px;">
                  <a href="${siteUrl}" style="color:#ad8150;text-decoration:none;">${displayUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function emailButton(href: string, label: string): string {
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:8px auto 4px;">
  <tr>
    <td style="background-color:#ad8150;border-radius:999px;">
      <a href="${href}" style="display:inline-block;padding:13px 32px;font-size:13px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;">${label}</a>
    </td>
  </tr>
</table>`;
}

function otpCodeBlock(code: string): string {
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:20px auto;">
  <tr>
    <td style="background-color:#faf6f0;border:1px solid #e5dfd3;border-radius:10px;padding:18px 36px;">
      <span style="font-family:Arial,sans-serif;font-size:32px;font-weight:bold;letter-spacing:10px;color:#2d2016;">${code}</span>
    </td>
  </tr>
</table>`;
}

export function orderConfirmationContent(
  orderNumber: string,
  customerName: string,
  amount: string,
  siteUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Order confirmation — ${orderNumber}`;
  const text = `Hi ${customerName}, thank you for your order ${orderNumber}. Amount paid: Rs ${amount}. Track it at ${siteUrl}/account/orders`;
  const html = emailShell(`
    <p style="margin:0 0 16px;">Hi ${customerName},</p>
    <p style="margin:0 0 16px;">Thank you for your order <strong>${orderNumber}</strong>. We have received your payment of <strong>Rs ${amount}</strong>.</p>
    <p style="margin:0 0 8px;">You can view your order any time in your account.</p>
    ${emailButton(`${siteUrl}/account/orders`, "View Order")}
    <p style="margin:24px 0 0;">— Khadeeja Empire</p>
  `);
  return { subject, html, text };
}

export function codOrderConfirmationContent(
  orderNumber: string,
  customerName: string,
  amountDue: string,
  siteUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Order confirmation — ${orderNumber}`;
  const text = `Hi ${customerName}, thank you for your order ${orderNumber}. Your order is confirmed. Please keep Rs ${amountDue} ready to pay on delivery. Track it at ${siteUrl}/account/orders`;
  const html = emailShell(`
    <p style="margin:0 0 16px;">Hi ${customerName},</p>
    <p style="margin:0 0 16px;">Thank you for your order <strong>${orderNumber}</strong>. Your order is confirmed.</p>
    <p style="margin:0 0 16px;">Please keep <strong>Rs ${amountDue}</strong> ready to pay on delivery.</p>
    <p style="margin:0 0 8px;">You can view your order any time in your account.</p>
    ${emailButton(`${siteUrl}/account/orders`, "View Order")}
    <p style="margin:24px 0 0;">— Khadeeja Empire</p>
  `);
  return { subject, html, text };
}

export function signupOtpContent(
  code: string,
  fullName: string
): { subject: string; html: string; text: string } {
  const subject = "Verify your email — Khadeeja Empire";
  const text = `Hi ${fullName}, your Khadeeja Empire verification code is ${code}. It expires in 5 minutes. If you did not request this, you can ignore this email.`;
  const html = emailShell(`
    <p style="margin:0 0 16px;">Hi ${fullName},</p>
    <p style="margin:0 0 4px;">Your Khadeeja Empire verification code is:</p>
    ${otpCodeBlock(code)}
    <p style="margin:0;color:#7a6a58;font-size:13px;">This code expires in 5 minutes. If you did not request this, you can ignore this email.</p>
    <p style="margin:24px 0 0;">— Khadeeja Empire</p>
  `, { center: true });
  return { subject, html, text };
}

export function loginOtpContent(code: string): { subject: string; html: string; text: string } {
  const subject = "Your login code — Khadeeja Empire";
  const text = `Your Khadeeja Empire login code is ${code}. It expires in 5 minutes. If you did not request this, you can ignore this email.`;
  const html = emailShell(`
    <p style="margin:0 0 4px;">Your Khadeeja Empire login code is:</p>
    ${otpCodeBlock(code)}
    <p style="margin:0;color:#7a6a58;font-size:13px;">This code expires in 5 minutes. If you did not request this, you can ignore this email.</p>
    <p style="margin:24px 0 0;">— Khadeeja Empire</p>
  `, { center: true });
  return { subject, html, text };
}

export function passwordResetContent(actionLink: string): { subject: string; html: string; text: string } {
  const subject = "Reset your password — Khadeeja Empire";
  const text = `We received a request to reset your Khadeeja Empire password. Reset it here: ${actionLink}. If you did not request this, you can ignore this email.`;
  const html = emailShell(`
    <p style="margin:0 0 16px;">We received a request to reset your Khadeeja Empire password.</p>
    ${emailButton(actionLink, "Reset Password")}
    <p style="margin:20px 0 0;color:#7a6a58;font-size:13px;">If you did not request this, you can ignore this email.</p>
    <p style="margin:24px 0 0;">— Khadeeja Empire</p>
  `, { center: true });
  return { subject, html, text };
}

export async function sendBrevoEmail(
  payload: BrevoEmailPayload,
  env: BrevoEnv = process.env
): Promise<void> {
  const apiKey = env.BREVO_API_KEY?.trim();
  const senderEmail = env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) {
    throw new Error("Brevo is not configured: set BREVO_API_KEY and BREVO_SENDER_EMAIL.");
  }
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: env.BREVO_SENDER_NAME?.trim() || "Khadeeja Empire" },
      to: [{ email: payload.to, name: payload.toName }],
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
    }),
  });
  if (!response.ok) {
    throw new Error(`Brevo send failed with status ${response.status}.`);
  }
}
