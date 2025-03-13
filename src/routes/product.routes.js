import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createProduct, deleteProduct, getAllProductOfDealer, getProductByName, updateProduct } from "../controllers/product.controller.js";
const router = Router();
router.post("/create-product",verifyJWT,createProduct)
router.put("/update-product",verifyJWT,updateProduct)
router.delete("/delete-product",verifyJWT,deleteProduct)
router.get("/get-by-name",verifyJWT,getProductByName)
router.get("/product-of-dealer",verifyJWT,getAllProductOfDealer)
export default router