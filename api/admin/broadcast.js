import { db, users } from '../../db/index.js';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const adminOk = await isAdminRequest(req);
    if (!adminOk) {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { subject, messageText, recipients: bodyRecipients } = body;

    if (!subject || !messageText) {
      return res.status(400).json({ error: 'Subject and message text are required' });
    }

    let recipients = [];
    if (Array.isArray(bodyRecipients) && bodyRecipients.length > 0) {
      recipients = bodyRecipients.filter(Boolean);
    } else {
      const allUsers = await db.select().from(users);
      recipients = allUsers.map(u => u.email).filter(Boolean);
    }

    if (recipients.length === 0) {
      return res.status(200).json({ success: true, count: 0, message: 'No recipients selected or available.' });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSender = process.env.SMTP_SENDER || `"Siri Traders" <${smtpUser}>`;

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ error: 'Mail server credentials are not configured on Vercel' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #faf9f6;">
        <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2d5016;">
          <h1 style="color: #2d5016; margin: 0; font-size: 24px; letter-spacing: 0.5px;">SIRI TRADERS</h1>
          <p style="color: #687466; margin: 4px 0 0; font-size: 13px;">Fast & Reliable Grocery Delivery</p>
        </div>
        
        <div style="color: #1f2937; font-size: 15px; line-height: 1.6; padding: 10px 0;">
          ${messageText.replace(/\n/g, '<br />')}
        </div>
        
        <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <a href="https://www.siritrader.com" style="display: inline-block; background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Visit Our Store</a>
          <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">
            H.No 10-152, Nagarjuna Colony Road No 12, Chitkul, Isnapur Municipality, Hyderabad — 502307<br />
            You are receiving this email because you are a registered user of Siri Traders.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: smtpSender,
      to: smtpUser,
      bcc: recipients,
      subject: subject,
      html: htmlContent
    });

    console.log(`[BROADCAST] Email campaign sent successfully to ${recipients.length} customers!`);
    return res.status(200).json({ success: true, count: recipients.length });

  } catch (error) {
    console.error("Error in /api/admin/broadcast:", error);
    return res.status(500).json({ error: error.message || 'Failed to send broadcast' });
  }
}
