import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
    {
        name: {
            type: String,
            
            trim: true
        },
        rate: {
            type: Number,
            min: 0
        },
        gstRate: {
            type: Number,
            min: 0,
            max: 28 ,
    
        },
       
        
        dealer: {
            type: Schema.Types.ObjectId,
            ref: "Dealer",
            required: true
        },
       
    },
    {
        timestamps: true
    }
);

export const Product = mongoose.model("Product", productSchema);