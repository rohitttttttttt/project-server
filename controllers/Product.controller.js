const express = require('express')
const Product = require('../models/Product.model');
const uploadinCloud = require('../config/cloudinary.config');
const getProduct = async (req , res) => {
    const {userName  , _id} = req.user ;
    const{ title , description , type , subType , quantity ,  quantityType ,price , location } = req.body
   if(!title || !description || !type || !subType || !quantity || !quantityType || !price || !location){
    console.log("some fields are missing")
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
    console.log("sending response bro ")
   return res.status(200).json({
    message:"product is registered",
    productToSend
   })
}

const homeProduct = async (req , res ) => {
    
    const productToReturn = await  Product.find().limit(10)
    if(!productToReturn){
        return res.status(404).json({
            message:"sorry we are out of products "
        })
    }

    return res.status(200).json({
        message:"here are your products",
        productToReturn
    })
}
const getProductByID = async (req,res) => {
     const id = req.params.id

     if(!id){
        return res.status(404).json({
            messsage : " we can't find the product "
        })
     }
     const productToSend = await Product.findById(id)
     if(!productToSend){
        return res.status(404).json({
            message:"sorry we are out of products "
        })
    }
     
     return res.status(200).json({
        message:"here are your products",
        productToSend
    })

}
const getProductBySearch = async (req , res) => {
    const{title ,  type , subType ,price , location } = req.query;
    const filter = {}

    if(!title && !type && !subType   && !price && !location){
        const productToSend =  await  Product.find().limit(1)

        return res.status(200).json({
            message:"here are your products",
            productToSend
        })
    }

    if(title){
        filter.title = title;
    }
    if(type) filter.type=type;
    if(subType) filter.subType = subType;
    if(price)filter.price =price;
    if(location) filter.location =location;

    

    const productToSend = await Product.find(filter).limit(1)
    if( productToSend.length === 0){
        return res.status(404).json({
            message:"sorry we are out of products "
        })
    }

    return res.status(200).json({
        message:"here are your products",
        productToSend
    })


}
const advanceSearch = async (req, res) => {
    const filter ={};
    const{title ,  type , subType ,price , location , page =1 , sortBy ="price" , limit =10} = req.query;
    if(!title && !type && !subType   && !price && !location){
        const productToSend =  await  Product.find().limit(1)

        return res.status(200).json({
            message:"here are your products",
            productToSend
        })
    }

    if(title){
        filter.title = {$regex:price , $options:"i" };
    }
    if(type) filter.type=type;
    if(subType) filter.subType = subType;
    if(price)filter.price = {$lte:price}
    if(location) filter.location =location;
    const sortOqtion ={};
    if(sortBy){
        sortOqtion[sortBy]=1;  // by default sab  kuch asceding order me ho ga 
    }

    const skip = (page-1)*limit //isse pata chalega ki total pages kitne same filters ke sath AKA pagination
    const productToSend = await  Product.find(filter).sort(sortOqtion).skip(skip).limit(limit)

    if( productToSend.length === 0){
        return res.status(404).json({
            message:"sorry we are out of products "
        })
    }

    return res.status(200).json({
        message:"here are your products",
        productToSend
    })

    
}

module.exports = {getProduct , homeProduct ,getProductByID ,getProductBySearch , advanceSearch}