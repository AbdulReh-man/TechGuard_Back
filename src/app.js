import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

//routes import
import userRouter from "./routes/user.routes.js";
 import productRouter from "./routes/product.routes.js";
 import categoryRouter from "./routes/category.routes.js";
 import cartRouter from "./routes/cart.routes.js";
 import orderRouter from "./routes/orders.routes.js";
 import serviceRouter from "./routes/service.routes.js";
 import adminRouter from "./routes/admin.Auth.js";
 import serviceBookingRouter from "./routes/serviceBooking.routes.js";
 import reviewRouter from "./routes/review.routes.js";
 import predictionRouter from "./routes/prediction.route.js"
 import predictRouter from "./routes/predict.routes.js"
//  import payment from "./routes/payment.routes.js";

//routes declaration
app.use("/api/techguard/users", userRouter);
 app.use("/api/techguard/products", productRouter);
 app.use("/api/techguard/category", categoryRouter);
  app.use("/api/techguard/cart", cartRouter);
  app.use("/api/techguard/orders", orderRouter);
  app.use("/api/techguard/services", serviceRouter);
  app.use("/api/techguard/admin", adminRouter);
  app.use("/api/techguard/serviceBooking", serviceBookingRouter);
  app.use("/api/techguard/review", reviewRouter);
//   app.use('/api', predictionRouter);
// app.use("/api/prediction", predictRouter);
  // app.use("/api/techguard/payment", payment);


  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
  
    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      errors: err.errors || [],
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  });

export { app };
