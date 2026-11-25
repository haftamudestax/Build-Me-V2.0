export interface TalkToUsEmail {
  reference: string;
  name: string;
  email: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Emails the owner. Reply-to is the visitor, so pressing Reply answers them. */
export async function sendTalkToUsNotification(
  input: TalkToUsEmail,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.TALK_TO_US_NOTIFY_EMAIL;
  const from = process.env.TALK_TO_US_FROM_EMAIL;

  if (!apiKey || !to || !from) throw new Error("Email is not configured");

  // No line breaks in the subject, so a name cannot inject headers.
  const subjectName = input.name.replace(/[\r\n]+/g, " ");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: input.email,
      subject: `New message from ${subjectName} (${input.reference})`,
      text: [
        `Reference: ${input.reference}`,
        `Name: ${input.name}`,
        `Email: ${input.email}`,
        "",
        input.message,
      ].join("\n"),
      html: `
        <p><strong>Reference:</strong> ${escapeHtml(input.reference)}<br>
        <strong>Name:</strong> ${escapeHtml(input.name)}<br>
        <strong>Email:</strong> ${escapeHtml(input.email)}</p>
        <p style="white-space: pre-wrap">${escapeHtml(input.message)}</p>
        <p style="color:#666">Press Reply to answer ${escapeHtml(input.name)} directly.</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}`);
  }
}