import dotenv from "dotenv";
import { app } from "./app.js";
dotenv.config({
  path: ".env",
});

import connectDB from "./db/db_Connection.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(
        `server is listen at PORT: http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log("Mongodb connectiob field", err);
  });
