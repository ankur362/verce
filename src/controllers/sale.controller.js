import express from "express";
import { Customer } from "../models/customer.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";
import { Sale } from "../models/sale.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import easyinvoice from "easyinvoice";
import fs from "fs";
import nodemailer from "nodemailer";
import { log } from "console";
import { asyncHandler } from "../utils/asyncHandler.js";




const createSale = asyncHandler(async (req, res) => {
    const { customerId, products, paymentMethod, amountPaid } = req.body;

    // Validate required fields
    if (!customerId || !products || products.length === 0 || !paymentMethod) {
        throw new ApiError(400, "All required fields must be provided");
    }

    const dealerId = req.dealer._id;

    // Validate dealer
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
        throw new ApiError(404, "Dealer not found");
    }

    // Validate customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
        throw new ApiError(404, "Customer not found");
    }

    let totalCost = 0;

    // Process each product
    const processedProducts = await Promise.all(
        products.map(async (prod) => {
            const { productId, quantity, rate, gstApplied } = prod;

            // Validate product existence
            const productExists = await Product.findById(productId);
            if (!productExists) {
                throw new ApiError(404, `Product with ID ${productId} not found`);
            }

            // Calculate total cost per product
            const gstAmount = (rate * quantity * gstApplied) / 100;
            const totalProductCost = rate * quantity + gstAmount;
            totalCost += totalProductCost;

            return {
                productId,
                productName: productExists.name,
                quantity,
                rate,
                gstApplied,
                totalCost: totalProductCost,
            };
        })
    );


    // Calculate remaining amount
    const remainingAmount = totalCost - (amountPaid || 0);



    // Create new sale entry
    const newSale = new Sale({
        dealer: dealerId,
        customer: customerId,
        products: processedProducts,
        totalCost,
        paymentDetails: {
            amountPaid: amountPaid || 0,
            remainingAmount,
        },
        paymentMethod,
    });

    await newSale.save();

    // Update Customer with the new sale
    await Customer.findByIdAndUpdate(
        customerId,
        {
            $push: { sale: newSale._id },
            $inc: {
                TotalBill: totalCost,
                outstandingBill: remainingAmount,
            }
        },
        { new: true }
    );

    // Update Dealer with total and outstanding bills
    await Dealer.findByIdAndUpdate(
        dealerId,
        {
            $inc: {
                TotalBill: totalCost,
                outStandingBill: remainingAmount,
            }
        },
        { new: true }
    );

    return res.status(201).json(
        new ApiResponse(201, newSale, "Sale created, and bills updated successfully")
    );
});


// Define transporter outside of the function
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Secure SSL port
    secure: true,
    auth: {
        user: process.env.EMAIL_USER, //  email
        pass: process.env.EMAIL_PASS  // App password 
    }
});

const generateInvoice = asyncHandler(async (req, res) => {
    const { saleId, recipientEmail } = req.body;

    // Fetch the sale details
    const sale = await Sale.findById(saleId)
        .populate("dealer", "name email phone")
        .populate("customer", "name email phone")
        .populate("products.productId", "name");

    if (!sale) {
        throw new ApiError(404, "Sale not found");
    }

    // Dealer & Customer Details
    const dealerName = sale.dealer?.name || "Unknown Dealer";
    const customerName = sale.customer?.name || "Unknown Customer";

    // Format product details into a table structure
    const productDetails = sale.products.map(prod => ({
        quantity: prod.quantity,
        description: prod.productName,
        price: prod.rate,
        "tax-rate": prod.gstApplied,
        total: prod.totalCost
    }));

    // Compute Remaining Amount
    const totalBill = sale.totalCost;
    const amountPaid = sale.paymentDetails.amountPaid;
    const remainingAmount = sale.paymentDetails.remainingAmount;

    // Invoice data for EasyInvoice
    const invoiceData = {
        sender: {
            company: dealerName,
            address: sale.dealer.email,
            phone: sale.dealer.phone
        },
        client: {
            company: customerName,
            address: sale.customer.email,
            phone: sale.customer.phone
        },
        information: {
            number: sale._id.toString(),
            date: new Date(sale.createdAt).toLocaleDateString()
        },
        products: productDetails,
        bottomNotice: `Total Bill: ₹${totalBill} | Amount Paid: ₹${amountPaid} | Remaining Balance: ₹${remainingAmount}`,
        settings: {
            currency: "INR"
        }
    };

    // Generate PDF
    const pdfResult = await easyinvoice.createInvoice(invoiceData);
    const filePath = `./temp/invoice_${saleId}.pdf`;

    // Write PDF to a file
    fs.writeFileSync(filePath, pdfResult.pdf, "base64");

    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Not Loaded");

    // Email options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: "Invoice for Your Purchase",
        text: `Hello ${customerName},\n\nPlease find attached the invoice for your recent purchase.\n\nTotal Bill: ₹${totalBill}\nAmount Paid: ₹${amountPaid}\nRemaining Balance: ₹${remainingAmount}\n\nBest regards,\n${dealerName}`,
        attachments: [
            {
                filename: `invoice_${saleId}.pdf`,
                path: filePath
            }
        ]
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        // Delete the local file after sending
        fs.unlinkSync(filePath);

        if (error) {
            console.error(" Email Sending Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to send invoice via email",
                error: error.message
            });
        }

        console.log("Email Sent Successfully:", info);
        return res.status(200).json({
            success: true,
            message: "Invoice sent successfully",
            emailInfo: info
        });
    });
});







//export default router;

export {
    createSale,
    generateInvoice
}
