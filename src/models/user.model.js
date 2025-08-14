import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const addressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
});



const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // url uploaded on cloudinary
      required: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"], //custom error
    },
    address: {
      type: addressSchema,
      required: false,
    },
    role: {
      type: String,
      enum: ["customer", "service-provider", "admin"],
      default: "customer",
    },
    serviceProviderDetails: {
      document: {
        type: [String],
        validate: {
          validator: function (docs) {
            return this.role === "service-provider" ? docs.length > 0 : true;

          },
          message: "At least one document is required for service providers.",
        },
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
        set: (v) => Math.round(v * 10) / 10, // Round to 1 decimal place
      },
    },
    isVerified: { type: Boolean, default: false }, // For email verification
    refreshtoken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", userSchema);
export { addressSchema };
