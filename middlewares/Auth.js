const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User.model')
const auth =async (req,res,next) => {
    
    const accessToken = req.headers["authorization"]?.replace("Bearer","").trim()||req.cookies?.accessToken
    
    if (typeof accessToken !== "string") {
        return res.status(400).json({ message: "Invalid token format." });
      }
   
    if(!accessToken){
        return res.status(404).json({
            message:"error user is not registered "
        })
    }
    const decodedToken =  jwt.verify(accessToken , process.env.ATS)
   
    const user =  await User.findById(decodedToken._id);
   
    if(!user){
        return res.status(404).json({   
            message:"user is not legged in "
        }) 
    }
    req.user = user
    next();
}
module.exports = auth

//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDU2MjAxOTV9.96bIcRo3RthGpbMNGAQ-ug3SrSXscpqm_l6AIEDlYfI