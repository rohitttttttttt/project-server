const { response } = require('express');
const fs = require('fs')
const cloudinary= require('cloudinary').v2

cloudinary.config({ 
    cloud_name: 'dy34qk6fs', 
    api_key: '793824892964863', 
    api_secret:  'fTeni7grawe72sdCZydweqSbbL0'
});

const uploadinCloud = async (filepath) => {
    try {
        const uploadResult = await cloudinary.uploader
       .upload(
           filepath
           ,{resourceType:"auto"}
       )

       fs.unlinkSync(filepath)
       return uploadResult.secure_url
    
    } catch (error) {
        console.log(error)
        fs.unlinkSync(filepath)
    }

}

module.exports = uploadinCloud