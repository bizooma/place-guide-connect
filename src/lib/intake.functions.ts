import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const TO_EMAIL = ["joe@bizooma.com", "sara@wefindinlove.org"];
const FROM_EMAIL = "The PLACE Intake <onboarding@resend.dev>";


function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "<em>—</em>";
  if (Array.isArray(value)) {
    if (value.length === 0) return "<em>—</em>";
    if (value.every((v) => typeof v !== "object")) {
      return value.map((v) => escapeHtml(v)).join(", ");
    }
    return value
      .map(
        (v, i) =>
          `<div style="margin:8px 0;padding:8px;border:1px solid #e5e7eb;border-radius:6px;"><strong>#${i + 1}</strong>${renderObject(v as Record<string, unknown>)}</div>`,
      )
      .join("");
  }
  if (typeof value === "object") {
    return renderObject(value as Record<string, unknown>);
  }
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function renderObject(obj: Record<string, unknown>): string {
  const rows = Object.entries(obj)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 10px;vertical-align:top;color:#374151;font-weight:600;width:38%;">${escapeHtml(k)}</td><td style="padding:6px 10px;vertical-align:top;">${renderValue(v)}</td></tr>`,
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px;">${rows}</table>`;
}

export const sendIntakeSubmission = createServerFn({ method: "POST" })
  .inputValidator((data: { submission: Record<string, unknown> }) => data)
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      throw new Error("Email service is not configured.");
    }

    const submission = data.submission;
    const name =
      (submission.fullLegalName as string) ||
      (submission.preferredName as string) ||
      "Unknown applicant";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;">
        <h2 style="color:#0D4538;">New Intake Form Submission</h2>
        <p style="color:#374151;">Applicant: <strong>${escapeHtml(name)}</strong></p>
        <p style="color:#6b7280;font-size:12px;">Submitted: ${escapeHtml(new Date().toISOString())}</p>
        ${renderObject(submission)}
      </div>
    `;

    const text = JSON.stringify(submission, null, 2);

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: (submission.email as string) || undefined,
        subject: `New Intake Submission — ${name}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend send failed", res.status, body);
      throw new Error(`Email send failed (${res.status})`);
    }

    return { ok: true as const };
  });
