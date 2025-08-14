import Joi from "joi";

const registerSchema = Joi.object({
  username: Joi.string().min(3).required().messages({
    "string.min": "Username must be at least 3 characters long",
    "string.empty": "Username is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/\d/, "number")
    .pattern(/[!@#$%^&*(),.?":{}|<>]/, "special character")
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.name": "Password must contain at least one Uppercase",
      "string.pattern.name": "Password must contain at least one number",
      "string.pattern.name":
        "Password must contain at least one specila character ",
      "string.empty": "Password is required",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Invalid email format",
    "string.empty": "Email is required",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
  }),
});

export { registerSchema, loginSchema };
