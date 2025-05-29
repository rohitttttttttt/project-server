const mongoose = require('mongoose')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema(
    {
        userName:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true,
        },
        fullName:{
            type:String,
            required:true,
        },
        profile:{
            type:String,
            
        },
        state:{
            type:String,
            required:true,
        },
        city:{
            type:String,
            required:true,
        },
        pincode:{
            type:Number,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        phone:{
            type:Number,
            required:true,
        },
        refreshToken:{
            type:String,
        },
        messages:{
            type:Array,
        }

    },{timestamps:true}
)
userSchema.pre("save" , async function(){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password , 10)
    }
}
    
)
userSchema.methods.isPassCorrect = async function (password)  {
    return bcrypt.compare(this.password , password)
};
userSchema.methods.generateAccessToken = async function ()  {
    return jwt.sign({
        _id : this._id,
        userName : this.userName
    },process.env.ATS )
}
userSchema.methods.generateRefreshToken = async function ()  {
    return jwt.sign({
        _id : this._id,
        userName : this.userName
    },process.env.RTS)
}

const User = mongoose.model("User", userSchema);
module.exports = User;