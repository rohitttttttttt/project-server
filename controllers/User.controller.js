const express = require('express')
const User = require('../models/User.model')

const signUp = async (req , res) => {
   
   
     const{userName , fullName , password ,state , city , pincode , phone , email}= req.body;
  
    if(!userName || !fullName || !password || !state || !city || !pincode || !phone || !email){
        return res.status(404).json(
            {
                message:"some fileds are missing "
            }
        ) 
    }
   const isUserAlreadyExist =  await User.findOne({userName})
   if(isUserAlreadyExist){
    return res.status(404).json(
        {
            message:"user is already register "
        }
    )
   }

   
   let user = await User.create(
    {
       userName,
       fullName,
       password,
       state , 
       city , 
       pincode , 
       phone , 
       email
        
    }
   )
   user = await User.findOne({userName})

   const accessToken =await user.generateAccessToken();
   const Rtoken =await user.generateRefreshToken();
   user.refreshToken = Rtoken
   await  user.save()

    const safeuser = await User.findById(user._id).select("-password")
   
   
   const options = {
     secure:true,
     httpOnly:true
   }
    res.cookie("accessToken" , accessToken ,options )
   return res
   .status(200)
   .json({
    message:"user registered sucessfuly",
    safeuser
   })


}
const login =  async (req , res) => {
    const {userName , password } =  req.body;
    const user = await User.findOne({userName});
    if(!user){
        return res.status(404).json({
            message:"user is not registered"
        })
    }
    const passCorrect = User.isPassCorrect(password);
    if(!passCorrect){
        return res.status(200).json({
            message:"password is not correct"
        })

    }
    const accessToken =await user.generateAccessToken();
   const Rtoken =await user.generateRefreshToken();
   user.refreshToken = Rtoken
   await  user.save()

    const safeuser = await User.findById(user._id).select("-password -refreshToken")
   
   
   const options = {
     secure:true,
     httpOnly:true
   }
    res.cookie("accessToken" , accessToken ,options )
   return res
   .status(200)
   .json({
    message:"user loggedin  sucessfuly",
    safeuser
   })



}


module.exports={signUp}