import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

import { createCustomer } from "./controllers/customer.controller.js"; // Import customer creation function

dotenv.config(); // Load environment variables

const app = express();

// Configure CORS
app.use(
    cors({
        origin: "*", // Allow frontend access
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Routes Import
import dealerRouter from "./routes/dealer.routes.js";
import customerRouter from "./routes/customer.routes.js";
import productRouter from "./routes/product.routes.js";
import saleRouter from "./routes/sale.route.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Routes Declaration
app.use("/api/v1/dealer", dealerRouter);
app.use("/api/v1/customer", customerRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/sale", saleRouter);
app.use(errorHandler);
// Default Route (Fix for "Cannot GET /" issue)
app.get("/", (req, res) => {
    res.send(" API is running!");
});

export { app };