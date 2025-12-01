// backend/utils/incidentNotifier.js
import nodemailer from "nodemailer";

/** Create Gmail transporter */
function makeTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    }
  });
}

/** Send incident alert email */
export async function sendIncidentAlert(user, incident) {
  if (!user?.email) return;

  const transporter = makeTransporter();
  const subject = `⚠️ New ${incident.category} incident near you`;

  const html = `
    <div style="font-family: Arial; max-width: 600px;">
      <h2 style="color:#c0392b;">⚠️ Incident Alert</h2>

      <p>A new <strong>${incident.category}</strong> incident was reported near your area.</p>

      <div style="background:#f5f5f5; padding:12px; border-radius:8px;">
        <p><strong>📍 Location:</strong> ${incident.location}</p>
        <p><strong>📝 Description:</strong> ${incident.description}</p>
        <p><strong>📏 Distance:</strong> ${incident.distance} km from your location</p>
      </div>

      <p style="margin-top:20px;">Stay safe and check details in the Community Feed.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"CypherX Alerts" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject,
      html
    });
    
    console.log(`📨 Incident alert sent to ${user.email}`);
  } catch (err) {
    console.error("Failed to send incident alert:", err.message);
  }
}

export default {
  sendIncidentAlert
};
