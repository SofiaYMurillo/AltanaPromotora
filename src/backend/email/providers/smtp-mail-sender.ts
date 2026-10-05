import { Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

import type { MailSender, MailSendResult } from "../mail-sender";

type SmtpMailSenderOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
};

type SmtpSocket = Socket | TLSSocket;

function encodeAddress(from: string) {
  const match = from.match(/<([^>]+)>/);
  return match?.[1] ?? from;
}

function toBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function quoteHeader(value: string) {
  return value.replace(/\r?\n/g, " ");
}

function createReader(socket: SmtpSocket) {
  let buffer = "";

  async function readReply() {
    while (true) {
      const complete = buffer.match(/(?:^|\n)(\d{3})(?: |\n)/);
      if (complete && !/^\d{3}-/m.test(buffer.split(/\r?\n/).pop() ?? "")) {
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const last = lines[lines.length - 1] ?? "";
        if (/^\d{3}(?: |$)/.test(last)) {
          const reply = buffer;
          buffer = "";
          return reply;
        }
      }

      const chunk = await new Promise<string>((resolve, reject) => {
        const onData = (data: Buffer | string) => {
          cleanup();
          resolve(typeof data === "string" ? data : data.toString("utf8"));
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          socket.off("data", onData);
          socket.off("error", onError);
        };
        socket.once("data", onData);
        socket.once("error", onError);
      });

      buffer += chunk;
    }
  }

  return {
    async expect(code: number) {
      const raw = await readReply();
      const actual = Number(raw.trim().slice(0, 3));
      if (actual !== code) {
        throw new Error(`smtp_${actual || "invalid"}`);
      }
      return raw;
    },
  };
}

function connectPlain(host: string, port: number) {
  return new Promise<Socket>((resolve, reject) => {
    const socket = new Socket();
    socket.once("error", reject);
    socket.connect(port, host, () => resolve(socket));
  });
}

function upgradeTls(socket: Socket, host: string) {
  return new Promise<TLSSocket>((resolve, reject) => {
    const secure = tlsConnect(
      { socket, host, servername: host },
      () => resolve(secure),
    );
    secure.once("error", reject);
  });
}

async function sendSmtpMessage(
  options: SmtpMailSenderOptions,
  message: { to: string; subject: string; text: string; html: string },
) {
  let socket: SmtpSocket = await connectPlain(options.host, options.port);
  let reader = createReader(socket);
  await reader.expect(220);
  socket.write("EHLO altana\r\n");
  await reader.expect(250);

  if (options.port !== 465) {
    socket.write("STARTTLS\r\n");
    await reader.expect(220);
    socket = await upgradeTls(socket as Socket, options.host);
    reader = createReader(socket);
    socket.write("EHLO altana\r\n");
    await reader.expect(250);
  }

  socket.write("AUTH LOGIN\r\n");
  await reader.expect(334);
  socket.write(`${toBase64(options.user)}\r\n`);
  await reader.expect(334);
  socket.write(`${toBase64(options.password)}\r\n`);
  await reader.expect(235);
  socket.write(`MAIL FROM:<${encodeAddress(options.from)}>\r\n`);
  await reader.expect(250);
  socket.write(`RCPT TO:<${message.to}>\r\n`);
  await reader.expect(250);
  socket.write("DATA\r\n");
  await reader.expect(354);

  const boundary = `altana-${Date.now()}`;
  const payload = [
    `From: ${quoteHeader(options.from)}`,
    `To: ${quoteHeader(message.to)}`,
    `Subject: ${quoteHeader(message.subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "",
    message.text,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "",
    message.html,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  socket.write(`${payload}\r\n.\r\n`);
  await reader.expect(250);
  socket.write("QUIT\r\n");
  socket.end();
}

export function createSmtpMailSender(
  options: SmtpMailSenderOptions,
): MailSender {
  return {
    async send(message): Promise<MailSendResult> {
      try {
        await sendSmtpMessage(options, message);
        return { ok: true, mode: "sent" };
      } catch {
        return { ok: false, error: "provider_rejected" };
      }
    },
  };
}
