const express = require('express')
const {Router} = require('express')
const router  = Router();
const {signUp , login, getUser} = require('../controllers/User.controller')
const auth = require('../middlewares/Auth')

router.post("/register",signUp)
router.post("/login",login)
router.get("/getUser" ,auth ,getUser)


module.exports=router