import express from "express";
import { Customer } from "../models/customer.model.js";
import { Dealer } from "../models/dealer.model.js";
import { Product } from "../models/product.model.js";
import { Sale } from "../models/sale.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import PdfPrinter from 'pdfmake';
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { log } from "console";
import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../utils/cloudinary.js"; // Import your configured Cloudinary instance
import AWS from "aws-sdk";

// Configure AWS SDK with credentials and region
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// const generateInvoice = async (sale, dealerName, customerName, products, amountPaid, totalCost, remainingAmount) => {
//     const saleId = sale._id.toString();
// const generateInvoice = async (salesId) => {
//     const { saleId } = salesId;
//     console.log("Generating invoice...");

//     // Validate required fields
//     if (!saleId) {
//         throw new ApiError(400, "Sale ID and recipient email are required");
//     }

//     // Fetch sale details
//     const sale = await Sale.findById(saleId)
//         .populate("dealer", "name email phone")
//         .populate("customer", "name email phone")
//         .populate("products.productId", "name");

//     if (!sale) {
//         throw new ApiError(404, "Sale not found");
//     }

//     // Extract dealer and customer details
//     const dealerName = sale.dealer?.name || "Unknown Dealer";
//     const customerName = sale.customer?.name || "Unknown Customer";

//     // Format product details
//     const productDetails = sale.products.map(prod => ({
//         quantity: prod.quantity,
//         price: prod.rate,
//         description: prod.productName,
//         tax: prod.gstApplied,
//         total: prod.totalCost
//     }));

//     // Calculate total amounts
//     const totalBill = sale.totalCost;
//     const amountPaid = sale.paymentDetails.amountPaid;
//     const remainingAmount = sale.paymentDetails.remainingAmount;

//     // PDF Font Configuration
//     const fonts = {
//         Roboto: {
//             normal: "node_modules/pdfmake/fonts/Roboto-Regular.ttf",
//             bold: "node_modules/pdfmake/fonts/Roboto-Medium.ttf",
//             italics: "node_modules/pdfmake/fonts/Roboto-Italic.ttf",
//             bolditalics: "node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf"
//         }
//     };

//     const printer = new PdfPrinter(fonts);

//     // Define PDF content
//     const docDefinition = {
//         content: [
//             { text: "Invoice", style: "header" },
//             {
//                 columns: [
//                     { text: `From:\n${dealerName}\n${sale.dealer.email}\n${sale.dealer.phone}`, margin: [0, 10, 0, 10] },
//                     { text: `To:\n${customerName}\n${sale.customer.email}\n${sale.customer.phone}`, alignment: "right", margin: [0, 10, 0, 10] }
//                 ]
//             },
//             { text: `Invoice Number: ${sale._id.toString()}\nDate: ${new Date(sale.createdAt).toLocaleDateString()}`, style: "invoiceInfo" },
//             { text: "Products", style: "subheader" },
//             {
//                 table: {
//                     headerRows: 1,
//                     widths: ["auto", "auto", "*", "auto", "auto"],
//                     body: [
//                         [{ text: "Quantity", style: "tableHeader" }, { text: "Price", style: "tableHeader" }, { text: "Description", style: "tableHeader" }, { text: "Tax", style: "tableHeader" }, { text: "Total", style: "tableHeader" }],
//                         ...productDetails.map(prod => [prod.quantity, prod.price, prod.description, prod.tax, prod.total])
//                     ]
//                 }
//             },
//             { text: `Total Bill: ₹${totalBill} | Amount Paid: ₹${amountPaid} | Remaining Balance: ₹${remainingAmount}`, style: "bottomNotice" }
//         ],
//         styles: {
//             header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
//             invoiceInfo: { margin: [0, 10, 0, 10] },
//             subheader: { fontSize: 15, bold: true, margin: [0, 15, 0, 5] },
//             tableHeader: { bold: true, fontSize: 12, color: "black" },
//             bottomNotice: { margin: [0, 15, 0, 0] }
//         }
//     };

//     // Ensure the 'public/invoices' directory exists
//     const invoiceDir = path.join("public", "invoices");
//     if (!fs.existsSync(invoiceDir)) {
//         fs.mkdirSync(invoiceDir, { recursive: true });
//     }

//     const fileName = `invoice_${saleId}.pdf`;
//     const filePath = path.join(invoiceDir, fileName);

//     // Create the PDF and save it to file
//     const pdfDoc = printer.createPdfKitDocument(docDefinition);
//     const writeStream = fs.createWriteStream(filePath);
//     pdfDoc.pipe(writeStream);
//     pdfDoc.end();

//     writeStream.on("finish", async () => {
//         console.log("PDF successfully created:", filePath);

//         try {
//             // Read the file from disk
//             const fileContent = fs.readFileSync(filePath);
            
//             // Upload the PDF file to AWS S3
//             const s3FileName = `invoices/invoice_${saleId}.pdf`;
//             const uploadParams = {
//                 Bucket: process.env.S3_BUCKET_NAME,
//                 Key: s3FileName,
//                 Body: fileContent,
//                 ContentType: "application/pdf"
//             };

//             console.log("S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME);
//             const uploadedFile = await s3.upload(uploadParams).promise();
//             const pdfUrl = uploadedFile.Location;
            
//             console.log("PDF successfully uploaded to AWS S3:", pdfUrl);

//             // Clean up the local file after upload
//             fs.unlinkSync(filePath);

//             return res.status(200).json(new ApiResponse(
//                 200,
//                 { invoiceUrl: pdfUrl },
//                 `Invoice generated successfully and available for download. ${pdfUrl}`
//             ));
//         } catch (error) {
//             console.error("Error uploading PDF to AWS S3:", error);
//             return res.status(500).json(new ApiResponse(500, null, "Failed to upload invoice to AWS S3"));
//         }
//     });
// };
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
  
    const salesId = newSale._id;
  
    // Update Customer with the new sale
    await Customer.findByIdAndUpdate(
      customerId,
      {
        $push: { sale: newSale._id },
        $inc: {
          TotalBill: totalCost,
          outstandingBill: remainingAmount,
        },
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
        },
      },
      { new: true }
    );
  
    console.log("Generating invoice...");
  
    // Validate saleId (it should exist since newSale is created)
    if (!salesId) {
      throw new ApiError(400, "Sale ID is required");
    }
  
    // Fetch sale details with population
    const sale = await Sale.findById(salesId)
      .populate("dealer", "name email phone")
      .populate("customer", "name email phone")
      .populate("products.productId", "name");
  
    if (!sale) {
      throw new ApiError(404, "Sale not found");
    }
  
    // Extract dealer and customer details
    const dealerName = sale.dealer?.name || "Unknown Dealer";
    const customerName = sale.customer?.name || "Unknown Customer";
  
    // Format product details
    const productDetails = sale.products.map((prod) => ({
      quantity: prod.quantity,
      price: prod.rate,
      description: prod.productName,
      tax: prod.gstApplied,
      total: prod.totalCost,
    }));
  
    // Calculate total amounts
    const totalBill = sale.totalCost;
    const AmountPaid = sale.paymentDetails.amountPaid;
    const RemainingAmount = sale.paymentDetails.remainingAmount;
  
    // PDF Font Configuration
    const fonts = {
      Roboto: {
        normal: "node_modules/pdfmake/fonts/Roboto-Regular.ttf",
        bold: "node_modules/pdfmake/fonts/Roboto-Medium.ttf",
        italics: "node_modules/pdfmake/fonts/Roboto-Italic.ttf",
        bolditalics: "node_modules/pdfmake/fonts/Roboto-MediumItalic.ttf",
      },
    };
  
    const printer = new PdfPrinter(fonts);
  
    // Define PDF content
    const docDefinition = {
      content: [
        { text: "Invoice", style: "header" },
        {
          columns: [
            {
              text: `From:\n${dealerName}\n${sale.dealer.email}\n${sale.dealer.phone}`,
              margin: [0, 10, 0, 10],
            },
            {
              text: `To:\n${customerName}\n${sale.customer.email}\n${sale.customer.phone}`,
              alignment: "right",
              margin: [0, 10, 0, 10],
            },
          ],
        },
        {
          text: `Invoice Number: ${sale._id.toString()}\nDate: ${new Date(
            sale.createdAt
          ).toLocaleDateString()}`,
          style: "invoiceInfo",
        },
        { text: "Products", style: "subheader" },
        {
          table: {
            headerRows: 1,
            widths: ["auto", "auto", "*", "auto", "auto"],
            body: [
              [
                { text: "Quantity", style: "tableHeader" },
                { text: "Price", style: "tableHeader" },
                { text: "Description", style: "tableHeader" },
                { text: "Tax", style: "tableHeader" },
                { text: "Total", style: "tableHeader" },
              ],
              ...productDetails.map((prod) => [
                prod.quantity,
                prod.price,
                prod.description,
                prod.tax,
                prod.total,
              ]),
            ],
          },
        },
        {
          text: `Total Bill: ₹${totalBill} | Amount Paid: ₹${AmountPaid} | Remaining Balance: ₹${RemainingAmount}`,
          style: "bottomNotice",
        },
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        invoiceInfo: { margin: [0, 10, 0, 10] },
        subheader: { fontSize: 15, bold: true, margin: [0, 15, 0, 5] },
        tableHeader: { bold: true, fontSize: 12, color: "black" },
        bottomNotice: { margin: [0, 15, 0, 0] },
      },
    };
  
    // Ensure the 'public/invoices' directory exists
    const invoiceDir = path.join("public", "invoices");
    if (!fs.existsSync(invoiceDir)) {
      fs.mkdirSync(invoiceDir, { recursive: true });
    }
  
    const fileName = `invoice_${salesId}.pdf`;
    const filePath = path.join(invoiceDir, fileName);
  
    // Create the PDF and save it to file
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const writeStream = fs.createWriteStream(filePath);
    pdfDoc.pipe(writeStream);
    pdfDoc.end();
  
    writeStream.on("finish", async () => {
      console.log("PDF successfully created:", filePath);
  
      try {
        // Read the file from disk
        const fileContent = fs.readFileSync(filePath);
  
        // Upload the PDF file to AWS S3
        const s3FileName = `invoices/invoice_${salesId}.pdf`;
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3FileName,
          Body: fileContent,
          ContentType: "application/pdf",
        };
  
        console.log("S3_BUCKET_NAME:", process.env.S3_BUCKET_NAME);
        const uploadedFile = await s3.upload(uploadParams).promise();
        const pdfUrl = uploadedFile.Location;
  
        console.log("PDF successfully uploaded to AWS S3:", pdfUrl);
  
        // Clean up the local file after upload
        fs.unlinkSync(filePath);
  
        return res.status(201).json(
          new ApiResponse(
            201,
            { newSale, invoiceUrl: pdfUrl },
            "Sale created, and bills updated successfully"
          )
        );
      } catch (error) {
        console.error("Error uploading PDF to AWS S3:", error);
        return res
          .status(500)
          .json(new ApiResponse(500, null, "Failed to upload invoice to AWS S3"));
      }
    });
  });
  
  export { createSale };
  