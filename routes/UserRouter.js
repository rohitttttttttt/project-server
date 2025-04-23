const express = require('express')
const {Router} = require('express')
const router  = Router();
const {signUp} = require('../controllers/User.controller')

router.post("/register",signUp)

module.exports=router