import tls from "tls";
import net from "net";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || (process.env.SMTP_SECURE === "false" ? "587" : "465"), 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = process.env.SMTP_SECURE !== "false"; // default true
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT || "info@scholar.name";
const CONTACT_FROM = process.env.CONTACT_FROM_EMAIL || SMTP_USER || "info@scholar.name";

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

type SocketLike = tls.TLSSocket | net.Socket;

function expectCode(response: string, allowed: number[]) {
  const code = parseInt(response.slice(0, 3), 10);
  if (!allowed.includes(code)) {
    throw new Error(`Unexpected SMTP response ${code}: ${response.trim()}`);
  }
}

function readResponse(socket: SocketLike): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      for (const line of lines) {
        if (line.length < 4) continue;
        const code = line.slice(0, 3);
        const separator = line[3];
        if (!/^\d{3}$/.test(code)) continue;
        if (separator === " ") {
          cleanup();
          resolve(buffer.trim());
          return;
        }
      }
    };
    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      socket.off("data", onData);
      socket.off("error", onError);
    };

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendCommand(socket: SocketLike, command: string): Promise<string> {
  socket.write(`${command}\r\n`);
  return await readResponse(socket);
}

function buildMessage(inquiry: ContactInquiry) {
  const subject = `New contact inquiry from ${inquiry.fullName}`;
  const headers = [
    `From: ScholarSite <${CONTACT_FROM}>`,
    `To: ${CONTACT_RECIPIENT}`,
    `Reply-To: ${inquiry.email}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
  ];

  return `${headers.join("\r\n")}\r\n\r\n${toText(inquiry)}\r\n`;
}

export async function sendContactEmail(inquiry: ContactInquiry) {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("Email service not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS).");
  }

  let socket: SocketLike = SMTP_SECURE
    ? tls.connect({
        host: SMTP_HOST,
        port: SMTP_PORT,
        rejectUnauthorized: false,
      })
    : net.connect({
        host: SMTP_HOST,
        port: SMTP_PORT,
      });

  try {
    const welcome = await readResponse(socket);
    expectCode(welcome, [220]);

    let ehlo = await sendCommand(socket, `EHLO ${SMTP_HOST}`);
    expectCode(ehlo, [250]);

    // Upgrade via STARTTLS when SMTP_SECURE is false (common for port 587)
    if (!SMTP_SECURE) {
      const startTlsResp = await sendCommand(socket, "STARTTLS");
      expectCode(startTlsResp, [220]);

      socket = tls.connect({
        host: SMTP_HOST,
        socket: socket as net.Socket,
        rejectUnauthorized: false,
      });

      ehlo = await sendCommand(socket, `EHLO ${SMTP_HOST}`);
      expectCode(ehlo, [250]);
    }

    const authLogin = await sendCommand(socket, "AUTH LOGIN");
    expectCode(authLogin, [334]);

    const userResp = await sendCommand(socket, Buffer.from(SMTP_USER).toString("base64"));
    expectCode(userResp, [334]);

    const passResp = await sendCommand(socket, Buffer.from(SMTP_PASS).toString("base64"));
    expectCode(passResp, [235]);

    const mailFrom = await sendCommand(socket, `MAIL FROM:<${CONTACT_FROM}>`);
    expectCode(mailFrom, [250]);

    const rcptTo = await sendCommand(socket, `RCPT TO:<${CONTACT_RECIPIENT}>`);
    expectCode(rcptTo, [250, 251]);

    const dataResp = await sendCommand(socket, "DATA");
    expectCode(dataResp, [354]);

    socket.write(buildMessage(inquiry) + "\r\n.\r\n");
    const dataFinish = await readResponse(socket);
    expectCode(dataFinish, [250]);

    await sendCommand(socket, "QUIT");

    return { id: `smtp-${Date.now()}` };
  } finally {
    socket.end();
  }
}
