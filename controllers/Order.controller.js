const Product =require('../models/Product.model');
const User = require('../models/User.model');
const mongoose = require('mongoose')
const Order = require('../models/Order.model')

const placeOrder = async (req , res ) => {
    const {seller ,productId ,quantity , quantityType ,price , deliveryAdress   } = req.body;
    const custoumer = req.user._id;
    if(!seller && !productId && !quantity && !quantityType && !price && !deliveryAdress && !custoumer ){
        return res
        .status(404)
        .json(
            {
                message:"some fields are missing "
            }
        )
    }
   console.log(seller)
   console.log(productId )
    const sellerid = await User.findById(seller); 
    if(!sellerid){
        return res.status(404).json({
            message:"no such seller exist"
        })
    } 
    const pID = await  Product.findById(productId)
    if(!pID){
        return res.status(404).json({
            message:"no such product exist"
        })
    }
   

    const orderTOSend = await Order.create({seller ,productId ,quantity , quantityType ,price , deliveryAdress ,custoumer } )
    if(!orderTOSend){
        return res.status(404).json({
            message:"unable to place order at this time "
        })
    }

    return res.status(200).json({
        message:"order placed succesfully",
        orderTOSend
    })
}

module.exports = {placeOrder}

