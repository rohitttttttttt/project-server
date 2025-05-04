 const express = require('express');
 const {Router} = require('express');
const auth = require('../middlewares/Auth');
const { placeOrder } = require('../controllers/Order.controller');

 const router = Router()

 router.post("/placeOrder" , auth , placeOrder)


 module.exports = router  