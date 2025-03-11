import mongoose, { Schema } from "mongoose";

const saleSchema = new Schema(
    {
      
        dealer: {
            type: Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
 
        customer: {
            type: Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },
       
        products: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: "Product",
                required: true
            },
            productName:{
                type:String,
                required:true

            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            rate: {
                type: Number,
                required: true,
                min: 0
            },
            gstApplied: {
                type: Number,
                required: true,
                min: 0,
                max: 28
            },
            totalCost: {
                type: Number,
                required: true
            }
        }],
        
        totalCost: {
            type: Number,
            required: true,
            min: 0
        },
      
       
       
        paymentDetails: {
            amountPaid: {
                type: Number,
                default: 0
            },
            remainingAmount: {
                type: Number,
                default: 0
            }
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "UPI", "Card", "Mix of All"],
            required: true
        },
    
    
    },
    {
        timestamps: true
    }
);

export const Sale = mongoose.model("Sale", saleSchema);