const express = require('express')
const {Router} = require('express')
const router  = Router();
const {signUp , login} = require('../controllers/User.controller')

router.post("/register",signUp)
router.post("/login",login)


module.exports=router