import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM!, // Ex: 'onboarding@votredomaine.com'
      to,
      subject,
      html,
    });

    if (error) {
      console.error("❌ Erreur envoi email :", error);
      return;
    }

    //console.log("✅ Email envoyé avec succès !", data);
  } catch (error) {
    console.error("❌ Erreur envoi email :", error);
  }
};
