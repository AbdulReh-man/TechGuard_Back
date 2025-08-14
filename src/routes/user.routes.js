import { Router } from "express";
import {
  registerUser,
  sendVerificationMail,
  loginUser,
  logoutUser,
  refresh_The_AccessToken,
  changeCurrentUserPassword,
  userPasswordReset,
  sendUserPasswordResetEmail
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../../utils/joiSchemas.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();


//public routes
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "document",
      maxCount: 1,
    },
  ]),
  validate(registerSchema),
  registerUser
);

router.route("/Verify/:token").get(sendVerificationMail);

router.route("/login").post(validate(loginSchema), loginUser);
router.route("/send_reset_password_email").post(sendUserPasswordResetEmail)
router.route("/reset_password/:id/:token").post(userPasswordReset)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-accesstoken").post(refresh_The_AccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentUserPassword);

export default router;
