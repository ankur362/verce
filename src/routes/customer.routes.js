import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createCustomer,
    deleteCustomer,
    getOutstandingBill,
    getTotalBill,
    updateCustomer
} from "../controllers/customer.controller.js";
const router = Router();
router.post("/customer-register", verifyJWT, createCustomer);
router.put("/customer-register", verifyJWT, updateCustomer);
router.delete("/customer-delete", verifyJWT, deleteCustomer);
router.get("/customer-outstanding", verifyJWT, getOutstandingBill);
router.get("/customer-totalBill", verifyJWT, getTotalBill);





export default router;