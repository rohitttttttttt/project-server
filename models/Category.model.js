const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    Category:{
        type:String,
        required:true
    },
    subCategory:[{
        type:String,
        required:true
    }]
}, { timestamps: true });
categorySchema.index({ name: 1 }, { unique: true });
const Category = mongoose.model('Category', categorySchema);
module.exports = Category;