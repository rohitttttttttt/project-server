const mongoose = require('mongoose');

const productSchema =  new mongoose.Schema({
    title:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        required:true,
    },
    subType:{
        type:String,
        required:true,
    },
    quantity:{
        type:Number,
        required:true,
    },
    quantityTpe:{
        type:String,
        required:true,
    },
    price:{
        type:Number,
        required:true,
    },
    location:{
        type:String,
        required:true,
    },
    owner:{
        type: mongoose.Types.ObjectId,
        required:true,
    },
},{timestamps:{
    required:true
}})
const Product = mongoose.model("Product" , productSchema)
module.exports = Product