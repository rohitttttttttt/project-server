/**const express = require('express')
const {Router} =require('express')
const  upload  = require('../middlewares/Multer.middleware')
const { getProduct } = require('../controllers/Product.controller')
const auth = require('../middlewares/Auth')

const router  = Router()


router.post("/newProduct" ,upload.fields([{
    name:"images",
    maxCount:1
}]),auth,getProduct)
 
module.exports = router */

const express = require('express');
const { Router } = require('express');
const upload = require('../middlewares/Multer.middleware'); // ❗without {}
const { getProduct } = require('../controllers/Product.controller');
const auth = require('../middlewares/Auth');

const router = Router();

router.post(
  "/newProduct",
  upload.fields([{ name: "images", maxCount: 1 }]),
  auth,
  getProduct
);

module.exports = router;

