import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: process.env.SMTP_USER
    ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    : undefined,
});

export async function sendLetterEmail(
  to: string,
  doctorName: string,
  rtfContent: string,
  filename: string
): Promise<void> {
  const safeFilename = filename.replace(/\.[^.]+$/, ".rtf");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@skycomm.com.au",
    to,
    subject: `Transcription Complete - ${safeFilename}`,
    text: `Dear ${doctorName},\n\nYour transcription is ready. Please find the formatted letter attached.\n\nRegards,\nSkyTP Transcription Service`,
    attachments: [
      {
        filename: safeFilename,
        content: Buffer.from(rtfContent, "utf-8"),
        contentType: "application/rtf",
      },
    ],
  });
}

export async function sendUnknownSenderReply(to: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@skycomm.com.au",
    to,
    subject: "SkyTP - Unregistered Email",
    text: "Sorry, your email is not registered with our transcription service. Contact help@skycomm.com.au to get set up.",
  });
}
