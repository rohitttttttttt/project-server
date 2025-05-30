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
const upload = require('../middlewares/Multer.middleware');
const { getProduct ,homeProduct , getProductBySearch , getProductByID , advanceSearch} = require('../controllers/Product.controller');
const auth = require('../middlewares/Auth');

const router = Router();

router.post(
  "/newProduct",
  auth,
  upload.fields([{ name: "images", maxCount: 1 }]),
  getProduct
);
router.get(
    "/getProductsforHomePage/:page",
    auth,
    homeProduct
);
router.get(
    "/id",
    auth ,
    getProductByID
);
router.get(
    "/search",
    auth,
    getProductBySearch
)
router.get(
    "/advanceSearch",
    auth,
    advanceSearch
)
module.exports = router;

