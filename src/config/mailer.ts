import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendOTPEmail = async (to: string, otpCode: string): Promise<void> => {
  const mailOptions = {
    from: `"App Support" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verification Code (OTP) for Account Registration',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; padding: 40px 16px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 8px; border: 1px solid #e4e4e7;">
                
                <!-- Main Body -->
                <tr>
                  <td style="padding: 40px 32px;">
                    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #09090b; line-height: 1.4;">
                      Use the Following OTP Code to Verify Your Account
                    </h1>
                    
                    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #52525b;">
                      To proceed with your account registration, please enter the following verification code (OTP) on the verification page:
                    </p>

                    <!-- OTP Code Area -->
                    <div style="margin-bottom: 28px;">
                      <span style="font-size: 18px; font-weight: 700; color: #09090b; letter-spacing: 0.5px;">
                        Your OTP Code: <span style="font-size: 22px; color: #18181b; letter-spacing: 2px;">${otpCode}</span>
                      </span>
                    </div>

                    <p style="margin: 0 0 28px 0; font-size: 13px; line-height: 1.5; color: #71717a;">
                      If you did not request this registration, please ignore this email.
                    </p>

                    <!-- Warning Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f5; border-left: 4px solid #3f3f46; border-radius: 0 4px 4px 0;">
                      <tr>
                        <td style="padding: 12px 16px;">
                          <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #3f3f46;">
                            <strong>WARNING:</strong> This OTP code is confidential and valid for 10 minutes only. Never share this code with anyone.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; border-top: 1px solid #f4f4f5; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #a1a1aa;">
                      This is an automated email sent by the system. Please do not reply to this email.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  await transporter.sendMail(mailOptions);
};