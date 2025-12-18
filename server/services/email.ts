import nodemailer from 'nodemailer';

const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "info@scholar.name";
const SMTP_HOST = process.env.SMTP_HOST || "mail.scholar.name";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "465", 10);
const SMTP_USER = process.env.SMTP_USER || "info@scholar.name";
const SMTP_PASS = process.env.SMTP_PASS;

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

const createTransporter = () => {
  if (!SMTP_PASS) {
    throw new Error("Email service not configured (missing SMTP_PASS).");
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

export async function sendContactEmail(inquiry: ContactInquiry) {
  const transporter = createTransporter();

  const mailOptions = {
    from: `ScholarName <${SMTP_USER}>`,
    to: CONTACT_RECIPIENT,
    replyTo: inquiry.email,
    subject: `New contact inquiry from ${inquiry.fullName}`,
    text: toText(inquiry),
    html: toHtml(inquiry),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent:", info.messageId);
  return { id: info.messageId };
}
