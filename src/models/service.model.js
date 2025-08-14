import mongoose from "mongoose";
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  // Name of the service
  serviceName: { type: String, required: true }, // Always required
  // Description of the service
  description: { type: String, required: true },
  // Price of the service
  price: { type: Number, required: true },
  // Availability of the service
  availability: {
    type: String,
    enum: ["available", "unavailable"],
    default: "available",
    required: true,
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true,
  },
  serviceProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export const Service = mongoose.model("Service", serviceSchema);