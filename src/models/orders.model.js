import mongoose,{Schema} from "mongoose";
import {addressSchema} from "./user.model.js";

const OrderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [
        {
            product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] }
        }
    ],
    shippingAddress: { type: addressSchema, required: true },
    paymentMethod: { type: String, enum: ["COD", "Online"], default: "COD" },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
    orderPrice: { type: Number, required: true, default: 0 },
    orderStatus: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
},
{ timestamps: true });

export const Order = mongoose.model("Order", OrderSchema);