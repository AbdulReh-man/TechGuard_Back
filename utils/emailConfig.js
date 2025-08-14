import dotenv from "dotenv";
dotenv.config({
  path: ".env",
});
import nodemailer from "nodemailer";

const sendEmail = async (to, subject, html) => {
  console.log(process.env.EMAIL_USER, process.env.EMAIL_PASS);
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    port: process.env.EMAIL_PORT,
    secure: false, // true for port 465, false for other portsr
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };
  try {
    console.log("sending");
    const info = await transporter.sendMail(mailOptions);
    console.log(info);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export default sendEmail;
