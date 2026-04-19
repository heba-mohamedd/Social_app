export const emailTemplete = (otp: number) => {
  return `
<div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    
    <!-- Logo / Title -->
    <h2 style="color: #4CAF50; margin-bottom: 10px;">🔐 Saraha App</h2>
    
    <!-- Greeting -->
    <p style="color: #333; font-size: 16px;">
      Hello 👋
    </p>

    <!-- Message -->
    <p style="color: #555; font-size: 15px;">
      Use the following OTP code to complete your verification:
    </p>

    <!-- OTP Box -->
    <div style="margin: 25px 0;">
      <span style="display: inline-block; background: #f1f1f1; padding: 15px 30px; font-size: 28px; letter-spacing: 6px; border-radius: 8px; font-weight: bold; color: #333;">
       code :  ${otp}
      </span>
    </div>

    <!-- Expiry -->
    <p style="color: #888; font-size: 13px;">
      ⏳ This code will expire in <b>2 minutes</b>
    </p>

    <!-- Warning -->
    <p style="color: #999; font-size: 12px; margin-top: 20px;">
      If you didn’t request this code, please ignore this email.
    </p>

  </div>
</div>
`;
};
