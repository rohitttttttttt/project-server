const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        
    },

    subCategory: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true , 
        min: 0
    },

    unit: {
        type: String,
        enum: ["kg", "quintal", "piece", "litre", "dozen"],
        required: true ,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    minOrderQuantity: {
        type: Number,
        default: 1
    },

    images: {
        type: [String],
        default: [],
        validate: [arr => arr.length <= 5, 'Max 5 images allowed']
    },

    isOrganic: {
        type: Boolean,
        default: false
    },

    isVeg: {
        type: Boolean,
        default: true
    },

    harvestDate: {
        type: Date,
        default: Date.now
    },

    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true,
    
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: [Number] // [lng, lat]
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },

    numberOfReviews: {
        type: Number,
        default: 0
    }

}, { timestamps: true });

productSchema.index({ categoryId: 1, subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ title: "text", description: "text" });
productSchema.index({ location: "2dsphere" });
productSchema.index({ averageRating: 1 });
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
