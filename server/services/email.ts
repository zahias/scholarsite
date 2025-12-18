const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "info@scholar.name";
const CONTACT_FROM = process.env.CONTACT_FROM_EMAIL || "no-reply@scholar.name";
const RESEND_API_URL = process.env.RESEND_API_URL || "https://api.resend.com/emails";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface ContactInquiry {
  fullName: string;
  email: string;
  institution?: string;
  role?: string;
  planInterest: string;
  researchField?: string;
  openalexId?: string;
  estimatedProfiles?: string;
  biography: string;
}

const formatLines = (inquiry: ContactInquiry) => {
  const details = [
    `Name: ${inquiry.fullName}`,
    `Email: ${inquiry.email}`,
    inquiry.institution ? `Institution: ${inquiry.institution}` : undefined,
    inquiry.role ? `Role: ${inquiry.role}` : undefined,
    `Plan interest: ${inquiry.planInterest}`,
    inquiry.researchField ? `Research field: ${inquiry.researchField}` : undefined,
    inquiry.openalexId ? `OpenAlex ID: ${inquiry.openalexId}` : undefined,
    inquiry.estimatedProfiles ? `Estimated profiles: ${inquiry.estimatedProfiles}` : undefined,
  ].filter(Boolean);

  return details.join("\n");
};

const toHtml = (inquiry: ContactInquiry) => {
  const htmlLines = formatLines(inquiry)
    .split("\n")
    .map((line) => `<li>${line}</li>`)
    .join("");

  const formattedBio = inquiry.biography
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("<br>");

  const openalexLink = inquiry.openalexId
    ? `<p><strong>OpenAlex profile:</strong> <a href="https://openalex.org/${inquiry.openalexId}">https://openalex.org/${inquiry.openalexId}</a></p>`
    : "";

  return `
    <div>
      <p>New contact inquiry received.</p>
      <ul>${htmlLines}</ul>
      ${openalexLink}
      <p><strong>Biography / context:</strong><br>${formattedBio}</p>
    </div>
  `;
};

const toText = (inquiry: ContactInquiry) => {
  const openalexLine = inquiry.openalexId
    ? `OpenAlex: https://openalex.org/${inquiry.openalexId}\n`
    : "";

  return [
    "New contact inquiry received.",
    formatLines(inquiry),
    openalexLine,
    "Biography / context:",
    inquiry.biography,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const contactRecipientEmail = CONTACT_RECIPIENT;

export async function sendContactEmail(inquiry: ContactInquiry) {
  if (!RESEND_API_KEY) {
    throw new Error("Email service not configured (missing RESEND_API_KEY).");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `ScholarSite <${CONTACT_FROM}>`,
      to: [CONTACT_RECIPIENT],
      reply_to: inquiry.email,
      subject: `New contact inquiry from ${inquiry.fullName}`,
      text: toText(inquiry),
      html: toHtml(inquiry),
    }),
  });

  if (!response.ok) {
    const errorBody = await safeReadText(response);
    throw new Error(`Failed to send contact email: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<{ id: string }>;
}

async function safeReadText(response: Response) {
  try {
    return await response.text();
  } catch (error) {
    console.error("Failed to read response body for contact email:", error);
    return "<unavailable>";
  }
}
