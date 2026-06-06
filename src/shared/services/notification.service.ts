import { NotificationType } from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";
import { sendEmail } from "../../infrastructure/email/email.service";
import { wrapEmailContent } from "../../infrastructure/email/templates/layout";

export const notificationService = {
  /**
   * 📧 + 🔔 Envoie email ET crée une notification
   */
  async sendEmailAndNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    serviceId: string,
  ) {
    // Vérifier utilisateur et service
    const [user, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!user) throw new Error("Utilisateur introuvable.");
    if (!service) throw new Error("Service introuvable.");

    // Créer notification en base
    const notification = await prisma.notification.create({
      data: {
        userId,
        serviceId,
        title,
        message,
        type,
      },
    });

    // Envoyer email
    await sendEmail(
      user.email,
      `📩 ${title}`,
      wrapEmailContent(`
        <p>${message}</p>
        <br/>
        <p><small>Service : ${service.displayName}</small></p>
      `),
    ).catch((err) => {
      console.error("⚠️ Échec envoi email :", err);
    });

    return notification;
  },

  /**
   * 📧 Envoie uniquement un email (sans notification en base)
   */
  async sendEmailOnly(
    userEmail: string,
    title: string,
    message: string,
    serviceName?: string,
  ) {
    const htmlContent = wrapEmailContent(`
      <p>${message}</p>
      ${serviceName ? `<br/><p><small>Service : ${serviceName}</small></p>` : ""}
    `);

    await sendEmail(userEmail, `📩 ${title}`, htmlContent);
  },

  /**
   * 🔔 Crée uniquement une notification (sans email)
   */
  async sendNotificationOnly(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    serviceId: string,
  ) {
    // Vérifier que l'utilisateur et le service existent
    const [user, service] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
    ]);

    if (!user) throw new Error("Utilisateur introuvable.");
    if (!service) throw new Error("Service introuvable.");

    // Créer notification en base
    return prisma.notification.create({
      data: {
        userId,
        serviceId,
        title,
        message,
        type,
      },
    });
  },

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId },
      data: { isRead: true },
    });
  },

  /**
   * Récupère les notifications d'un utilisateur
   */
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      include: { service: true },
      orderBy: { created_at: "desc" },
    });
  },
};
