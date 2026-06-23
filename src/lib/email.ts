import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.EMAIL_FROM || 'noreply@ascentcapital.example.com';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Ascent Capital Partners';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Dev fallback - just log the email
  if (!resend) {
    console.log('📧 [DEV] Email would be sent:');
    console.log(`   To: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Body preview: ${options.html.substring(0, 200)}...`);
    return true;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export function getEmailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: 'Georgia', serif;
          line-height: 1.6;
          color: #1a365d;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #faf5eb;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #d4a853;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1a365d;
        }
        .content {
          padding: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #1a365d;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          padding: 20px 0;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${appName}</div>
        <div style="font-size: 14px; color: #d4a853;">Next Gen Platform</div>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
        <p>This email was sent from the Next Gen Platform.</p>
      </div>
    </body>
    </html>
  `;
}

export async function sendInviteEmail(
  email: string,
  inviterName: string,
  token: string,
  roles: string[]
): Promise<boolean> {
  const inviteUrl = `${appUrl}/invite/${token}`;
  const rolesText = roles.join(', ').toLowerCase();

  const content = `
    <h2>You've Been Invited</h2>
    <p>Hello,</p>
    <p><strong>${inviterName}</strong> has invited you to join the ${appName} Next Gen Platform as a ${rolesText}.</p>
    <p>The Next Gen Platform is designed to help prepare the next generation to be wise stewards of family wealth through education, mentorship, and practical experience.</p>
    <p style="text-align: center;">
      <a href="${inviteUrl}" class="button">Accept Invitation</a>
    </p>
    <p>This invitation will expire in 7 days. If you have any questions, please contact our program team.</p>
    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return sendEmail({
    to: email,
    subject: `You're invited to ${appName} Next Gen Platform`,
    html: getEmailTemplate(content),
  });
}

export async function sendSessionApprovalEmail(
  email: string,
  memberName: string,
  mentorName: string,
  scheduledAt: Date
): Promise<boolean> {
  const content = `
    <h2>Session Scheduled</h2>
    <p>Hello ${memberName},</p>
    <p>Your mentorship session with <strong>${mentorName}</strong> has been scheduled.</p>
    <p><strong>Date & Time:</strong> ${scheduledAt.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}</p>
    <p style="text-align: center;">
      <a href="${appUrl}/dashboard/mentorship" class="button">View Session Details</a>
    </p>
    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return sendEmail({
    to: email,
    subject: `Mentorship Session Scheduled with ${mentorName}`,
    html: getEmailTemplate(content),
  });
}

export async function sendTradeApprovalEmail(
  email: string,
  memberName: string,
  action: string,
  symbol: string,
  quantity: number,
  decision: string
): Promise<boolean> {
  const content = `
    <h2>Trade Request ${decision === 'approved' ? 'Approved' : 'Rejected'}</h2>
    <p>Hello ${memberName},</p>
    <p>Your trade request has been <strong>${decision}</strong>.</p>
    <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Action:</strong> ${action.toUpperCase()}</p>
      <p style="margin: 5px 0;"><strong>Symbol:</strong> ${symbol}</p>
      <p style="margin: 5px 0;"><strong>Quantity:</strong> ${quantity}</p>
    </div>
    <p style="text-align: center;">
      <a href="${appUrl}/dashboard/practicum/portfolio" class="button">View Portfolio</a>
    </p>
    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return sendEmail({
    to: email,
    subject: `Trade Request ${decision === 'approved' ? 'Approved' : 'Rejected'}: ${action.toUpperCase()} ${symbol}`,
    html: getEmailTemplate(content),
  });
}

export async function sendMilestoneNotificationEmail(
  email: string,
  memberName: string,
  milestoneName: string,
  description: string
): Promise<boolean> {
  const content = `
    <h2>🎉 Milestone Achieved!</h2>
    <p>Hello ${memberName},</p>
    <p>Congratulations! You've achieved a new milestone:</p>
    <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center;">
      <h3 style="color: #d4a853; margin: 0;">${milestoneName}</h3>
      <p style="margin: 10px 0 0 0;">${description}</p>
    </div>
    <p style="text-align: center;">
      <a href="${appUrl}/dashboard" class="button">View Your Progress</a>
    </p>
    <p>Keep up the great work!</p>
    <p>Best regards,<br>The ${appName} Team</p>
  `;

  return sendEmail({
    to: email,
    subject: `🎉 Milestone Achieved: ${milestoneName}`,
    html: getEmailTemplate(content),
  });
}
