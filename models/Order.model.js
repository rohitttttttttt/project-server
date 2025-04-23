const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    from:{
        type: mongoose.Types.ObjectId,
        ref:"User",
        required: true,
    },
    custoumer:{
        type: mongoose.Types.ObjectId,
        ref:"User",
        required: true,
    },
    quantity:{
        type: Number,
        required: true,
    },
    quantityType:{
        type: String,
        required: true,
    },
    price:{
        type: Number,
        required: true,
    },
    deliverAdress:{
        type: String,
        required: true,
    }

},{
    timestamps:true
})

const Order = mongoose.model("Order" , OrderSchema)
module.exports = Order

//mongodb+srv://speedcuts29:QITzhmt324KveGQs@cluster0.ptvhaze.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//QITzhmt324KveGQs