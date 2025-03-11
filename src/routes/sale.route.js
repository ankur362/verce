import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {  } from "../controllers/product.controller.js";
import { createSale, generateInvoice } from "../controllers/sale.controller.js";
const router = Router();
router.post("/buy-product",verifyJWT,createSale)
router.get("/invoices",verifyJWT, generateInvoice);
export default router 