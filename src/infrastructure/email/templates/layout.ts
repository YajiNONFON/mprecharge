export const wrapEmailContent = (content: string) => {
  return `
    <html>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:sans-serif;">
        <div style="max-width:600px;margin:0 auto;padding:20px;">
          <!-- Header -->
          <div style="background-color:#0a0f24;padding:20px;text-align:center;border-radius:6px 6px 0 0;">
            <h1 style="color:white;margin:0;font-size:24px;">MPAY Service</h1>
          </div>

          <!-- Main Content -->
          <div style="background-color:#ffffff;padding:30px;border:1px solid #ddd;">
            ${content}
          </div>

          <!-- Footer -->
          <div style="text-align:center;padding:20px;color:#888;font-size:13px;">
            Merci,<br />
            L'équipe <strong>MPAY Service</strong><br/>
            <p style="color:#aaa;font-size:11px;margin-top:10px;">Ceci est un message automatique, merci de ne pas répondre.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
