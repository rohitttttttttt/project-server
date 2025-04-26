const express = require('express')
const Product = require('../models/Product.model');
const uploadinCloud = require('../config/cloudinary.config');
const getProduct = async (req , res) => {
    const {userName  , _id} = req.user ;
    const{ title , description , type , subType , quantity ,  quantityType ,price , location } = req.body
   if(!title || !description || !type || !subType || !quantity || !quantityType || !price || !location){
    return res.status(404).json({
        message:"some fields are missing "
    })

   }
   console.log(req.files)
   const imgs = req.files.images
   if(!imgs){
    return res.status(404).json({
        message:"server error while getting images "
    })
   }
   const imgpath = imgs[0].path
   if(imgpath.length === 0){
    return res.status(404).json({
        message:"server error while getting images "
    })
   }
   const images = await uploadinCloud(imgpath)
   
 
const productToSend =await Product.create({
    title , description ,images, type , subType , quantity ,  quantityType ,price , location , owner:_id
   })
   
   return res.status(200).json({
    message:"product is registered",
    productToSend
   })
}

module.exports = {getProduct}