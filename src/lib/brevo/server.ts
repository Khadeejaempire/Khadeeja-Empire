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

export function orderConfirmationContent(
  orderNumber: string,
  customerName: string,
  amount: string,
  siteUrl: string
): { subject: string; html: string; text: string } {
  const subject = `Order confirmation — ${orderNumber}`;
  const text = `Hi ${customerName}, thank you for your order ${orderNumber}. Amount paid: Rs ${amount}. Track it at ${siteUrl}/account/orders`;
  const html = `<p>Hi ${customerName},</p>
<p>Thank you for your order <strong>${orderNumber}</strong>. We have received your payment of <strong>Rs ${amount}</strong>.</p>
<p>You can view your order any time in your <a href="${siteUrl}/account/orders">account</a>.</p>
<p>— Khadeeja Empire</p>`;
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
