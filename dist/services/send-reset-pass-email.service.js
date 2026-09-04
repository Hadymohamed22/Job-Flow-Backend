"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetPassEmail = void 0;
const mail_1 = require("../config/mail");
const sendResetPassEmail = async (email, resetCode) => await mail_1.gmailTransporter.sendMail({
    to: email,
    from: process.env.EMAIL_USER,
    subject: "Job Flow Reset Password",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#333;line-height:1.5;">
        <div style="max-width:600px;margin:0 auto;padding:24px;border:1px solid #eaeaea;border-radius:12px;background:#ffffff;">
          <h2 style="color:#1d4ed8;margin-bottom:16px;">Reset your Job Flow password</h2>
          <p>Hi there,</p>
          <p>We received a request to reset the password for your Job Flow account. Use the code below to continue.</p>
          <div style="margin:24px 0;padding:18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:10px;text-align:center;">
            <span style="display:inline-block;font-size:26px;font-weight:700;color:#1e40af;">${resetCode}</span>
          </div>
          <p style="margin-top:0;">Enter this code in the password reset form. It will expire shortly for your security.</p>
          <p>If you did not request a password reset, you can safely ignore this email.</p>
          <p style="margin-top:32px;">Thanks,<br/>The Job Flow Team</p>
        </div>
      </div>
    `,
});
exports.sendResetPassEmail = sendResetPassEmail;
//# sourceMappingURL=send-reset-pass-email.service.js.map