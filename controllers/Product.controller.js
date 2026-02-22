const mongoose = require('mongoose');
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const Category = require("../models/Category.model");
const Address = require("../models/Address.model");
const ProductAnalytics = require("../models/ProductAnalytics.model");

// ═══════════════════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════════════════

/** Sanitize pagination params (clamped: page >= 1, 1 <= limit <= 50) */
const paginate = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    return { page, limit, skip: (page - 1) * limit };
};

/** Reusable populate config for product list endpoints */
const PRODUCT_POPULATE = [
    { path: 'userId', select: 'fullName role' },
    { path: 'categoryId', select: 'Category subCategory' },
    { path: 'addressId', select: 'state city' },
];

/** Lightweight fields for thumbnail/card views (list APIs) */
const LITE_SELECT = 'title price unit averageRating numberOfReviews isOrganic ';

const addProduct = async (req , res) => {

    /*
    this api  will add a new product to the database 

    fields that it  will add in a Db are Mentioned below 

    userId : type ObjectId
    
    title : String
    description : String
    categoryId : type ObjectId
    subCategory : String
    price : Number
    unit : String
    stock : Number
    minOrderQuantity : Number
    images : [String]
    isOrganic : Boolean
    isVeg : Boolean
    harvestDate : Date
    addressId : type ObjectId
    location : String

    firstly  check  all  the input and input type  and if they are empty then return 

    then verify  category id and sub category 
    if not found then return 

    images will not be more than 5
    then verify the address id  if evry thing is fine add the product in db  

    
    
    */
    
    // inputs  from request body 

    try {
        const{title ,
             description ,
             categoryId ,
             subCategory ,
             price ,
             unit ,
             stock ,
             minOrderQuantity,
             isOrganic ,
             isVeg ,
             harvestDate ,
             addressId ,
             images  } = req.body
        const userId = req.user
        
    
        if(!title ||
            !description ||
            !categoryId ||
            !subCategory ||
            !price ||
            !unit ||
            !stock ||
            !minOrderQuantity ||
            isOrganic == undefined ||
            isVeg == undefined ||
            !harvestDate ||
            !addressId ||
            !images){
            return res.status(400).json({
                message:"some fields are missing "
            })
        }
        if(typeof title != "string" ||
            typeof description != "string" ||
            typeof categoryId != "string" ||
            typeof subCategory != "string" ||
            typeof price != "number" ||
            typeof unit != "string" ||
            typeof stock != "number" ||
            typeof minOrderQuantity != "number" ||
            typeof isOrganic != "boolean" ||
            typeof isVeg != "boolean" ||
           
            typeof addressId != "string" ){
            return res.status(400).json({
                message:"some fields are not of correct type "
            })
        }
        if(Array.isArray(images) == false){
            return res.status(400).json({
                message:"images should be an array "
            })
        }
        // directly  expecting url here 
        if(images.length > 5 || images.length < 1){
            return res.status(400).json({
                message:"images should not be more than 5 or less than 1 "
            })
        }

        if(price == 0 || stock == 0){
            return res.status(400).json({
                message:"price and stock should not be 0 "
            })
        }
        if(isNaN(Date.parse(harvestDate))){
            return res.status(400).json({
                message:"harvestDate should be a valid date "
            })
        }
    
        const [user, category, address] = await Promise.all([
            User.findById(userId),
            Category.findById(categoryId),
            Address.findById(addressId)
        ]);
        if(!user ){
            return res.status(400).json({
                message:"user not found "
            })
        }
        if(!category){
            return res.status(400).json({
                message:"category not found "
            })
        }
        if(!address){
            return res.status(400).json({
                message:"address not found "
            })
        }
        let flag = false ;
        for(let i = 0 ; i < category.subCategory.length ; i++){
            if(category.subCategory[i] == subCategory){
                flag = true ;
            }
        }
        if(flag == false){
            return res.status(400).json({
                message:"subCategory not found "
            })
        }
    
        const long = address.long
        const lat = address.lat
    
        const location = {
            type:"Point",
            coordinates:[long , lat]
        }
        
        const product =  new Product({
            userId,
            title : title.trim(),
            description : description.trim(),
            categoryId,
            subCategory,
            price,
            unit,
            stock,
            minOrderQuantity,
            images,
            isOrganic,
            isVeg,
            harvestDate,
            addressId,
            location
        })
    
        await product.save()
    
        return res.status(200).json({
            message:"product added successfully "
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}

const  search = async (req , res)=>{
    /*
    this search api  returns the product   to user  according to the  search  query  and filters 
     possible filters are 
     price 
     category 
     subCategory 
     isOrganic 
     averageRating 
     
    */
    try {
        const {searchQuery , 
            minPrice , 
            maxPrice , 
            category , 
            subCategory , 
            isOrganic , 
            averageRating} = req.body

            const page = req.query.page || 1;
            const limit = req.query.limit || 10;
            const skip = (page - 1) * limit;

        if(!searchQuery){
            return res.status(400).json({
                message:"searchQuery is required "
            })

        }
        if(minPrice ){
            if(typeof minPrice != "number"){
                return res.status(400).json({
                    message:"minPrice should be a number "
                })
            }
        }
        if(maxPrice){
            if(typeof maxPrice != "number"){
                return res.status(400).json({
                    message:"maxPrice should be a number "
                })
            }
        }
        if(category){
            if(typeof category != "string"){
                return res.status(400).json({
                    message:"category should be a string "
                })
            }
        }
        if(subCategory){
            if(typeof subCategory != "string"){
                return res.status(400).json({
                    message:"subCategory should be a string "
                })
            }
        }
        if(isOrganic){
            if(typeof isOrganic != "boolean"){
                return res.status(400).json({
                    message:"isOrganic should be a boolean "
                })
            }
        }
        if(averageRating){
            if(typeof averageRating != "number"){
                return res.status(400).json({
                    message:"averageRating should be a number "
                })
            }
        }

        const query = {};

// text search
        if (searchQuery) {
            query.$text = { $search: searchQuery };
        }

// price filter
        if (minPrice != null && maxPrice != null) {
            query.price = { $gte: minPrice, $lte: maxPrice };
        } else if (minPrice != null) {
            query.price = { $gte: minPrice };
        } else if (maxPrice != null) {
            query.price = { $lte: maxPrice };
        }

// category
        if (category) {
            query.categoryId = category;
        }

// subcategory
        if (subCategory) {
            query.subCategory = subCategory;
        }

        // organic
        if (isOrganic !== undefined) {
            query.isOrganic = isOrganic;
        }

        // rating
        if (averageRating != null) {
            query.averageRating = { $gte: averageRating };
        }
        query.score = { $meta: "textScore" };

        const products = await Product.find(query).select(LITE_SELECT).sort({ score: { $meta: "textScore" } }).skip(skip).limit(limit);

        let recommendedProducts 
        if(products.length < 10){
            recommendedProducts = await Product.find({
                $text: { $search: searchQuery },
                ...(category && {categoryId : category}),
                _id :{$nin : products.map(product => product._id)}
                
            }).select(LITE_SELECT).sort({ score: { $meta: "textScore" } }).limi(products.length - 10);
        }
        return res.status(200).json({
            message:"products fetched successfully ",
            products , 
            recommendedProducts
        })
        
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}

const getNearByProducts =(req , res)=>{
    try {

        const {latitude , longitude} = req.body
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;

        if(!latitude || !longitude){
            return res.status(400).json({
                message:"latitude and longitude are required "
            })
        }
        const lng = Number(longitude)
        const lat = Number(latitude)
        if(isNaN(lng) || isNaN(lat)){
            return res.status(400).json({
                message:"latitude and longitude should be numbers "
            })
        }
        const products  = Product.find({
            location:{
                $near:{
                    $geometry:{
                        type:"Point",
                        coordinates:[lng , lat]
                    },
                    
                }
            }
        }).select(LITE_SELECT).skip(skip).limit(limit)

        res.status(200).json({
            message:"products fetched successfully ",
            products
        })

        
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}

const getLatestProducts = (req , res)=>{
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;
        const products = Product.find().sort({createdAt:-1}).select(LITE_SELECT).skip(skip).limit(limit)

        res.status(200).json({
            message:"products fetched successfully ",
            products
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}
const getTopRatedProducts = (req , res)=>{
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;
       
        const products = Product.find().sort({averageRating:-1}).select(LITE_SELECT).skip(skip).limit(limit)

        res.status(200).json({
            message:"products fetched successfully ",
            products
        })
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}



// ═══════════════════════════════════════════════════
//  GET PRODUCT BY ID  (GET /product/:id)
// ═══════════════════════════════════════════════════
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(id).populate(PRODUCT_POPULATE);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Increment view count (fire-and-forget, doesn't block response)
        ProductAnalytics.findOneAndUpdate(
            { productId: id },
            { $inc: { productViews: 1 } },
            { upsert: true }
        ).exec();

        return res.status(200).json({ success: true, product });
    } catch (error) {
        console.error('GetProductById Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  HIGHLY RATED  (GET /product/top-rated)
//  Query: ?minRating=4&page=1&limit=10
// ═══════════════════════════════════════════════════
const getTopRated = async (req, res) => {
    try {
        const { page, limit, skip } = paginate(req.query);
        const minRating = parseFloat(req.query.minRating) || 4;

        const filter = {
            averageRating: { $gte: minRating },
            numberOfReviews: { $gte: 1 },
        };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ averageRating: -1, numberOfReviews: -1 })
                .skip(skip)
                .limit(limit)
                .populate(PRODUCT_POPULATE)
                .lean(),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetTopRated Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  BY CATEGORY  (GET /product/category/:categoryId)
//  Query: ?sortBy=price_asc|price_desc|rating|newest
// ═══════════════════════════════════════════════════
const getByCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const { page, limit, skip } = paginate(req.query);

        const sortOptions = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating: { averageRating: -1 },
            newest: { createdAt: -1 },
        };
        const sort = sortOptions[req.query.sortBy] || { createdAt: -1 };

        const filter = { categoryId };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate(PRODUCT_POPULATE)
                .lean(),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            category: { _id: category._id, name: category.Category, subCategories: category.subCategory },
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetByCategory Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  BY SUB-CATEGORY  (GET /product/category/:categoryId/:subCategory)
// ═══════════════════════════════════════════════════
const getBySubCategory = async (req, res) => {
    try {
        const { categoryId, subCategory } = req.params;

        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ success: false, message: 'Invalid category ID' });
        }

        const category = await Category.findById(categoryId).lean();
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        if (!category.subCategory.includes(subCategory)) {
            return res.status(404).json({ success: false, message: `Sub-category "${subCategory}" not found in ${category.Category}` });
        }

        const { page, limit, skip } = paginate(req.query);

        const sortOptions = {
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            rating: { averageRating: -1 },
            newest: { createdAt: -1 },
        };
        const sort = sortOptions[req.query.sortBy] || { createdAt: -1 };

        const filter = { categoryId, subCategory };

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate(PRODUCT_POPULATE)
                .lean(),
            Product.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            category: category.Category,
            subCategory,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetBySubCategory Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  HOME PAGE FEED  (GET /product/feed)
//  Returns curated sections for the home screen
// ═══════════════════════════════════════════════════
const getHomeFeed = async (req, res) => {
    try {
        const [latest, topRated, organic] = await Promise.all([
            Product.find()
                .sort({ createdAt: -1 })
                .limit(10)
                .populate(PRODUCT_POPULATE)
                .lean(),
            Product.find({ averageRating: { $gte: 4 }, numberOfReviews: { $gte: 1 } })
                .sort({ averageRating: -1 })
                .limit(10)
                .populate(PRODUCT_POPULATE)
                .lean(),
            Product.find({ isOrganic: true })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate(PRODUCT_POPULATE)
                .lean(),
        ]);

        const categories = await Category.find().select('Category subCategory').lean();

        return res.status(200).json({
            success: true,
            sections: { latest, topRated, organic },
            categories,
        });
    } catch (error) {
        console.error('GetHomeFeed Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  MY PRODUCTS — Farmer's own listings  (GET /product/my/products)
//  Requires auth middleware
// ═══════════════════════════════════════════════════
const getMyProducts = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page, limit, skip } = paginate(req.query);

        const [products, total] = await Promise.all([
            Product.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'Category subCategory')
                .lean(),
            Product.countDocuments({ userId }),
        ]);

        return res.status(200).json({
            success: true,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetMyProducts Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  SELLER'S PRODUCTS — Public profile  (GET /product/seller/:sellerId)
// ═══════════════════════════════════════════════════
const getSellerProducts = async (req, res) => {
    try {
        const { sellerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sellerId)) {
            return res.status(400).json({ success: false, message: 'Invalid seller ID' });
        }

        const seller = await User.findById(sellerId).select('fullName role').lean();
        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller not found' });
        }

        const { page, limit, skip } = paginate(req.query);

        const [products, total] = await Promise.all([
            Product.find({ userId: sellerId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('categoryId', 'Category subCategory')
                .lean(),
            Product.countDocuments({ userId: sellerId }),
        ]);

        return res.status(200).json({
            success: true,
            seller,
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('GetSellerProducts Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


// ═══════════════════════════════════════════════════
//  TODO: BEST SELLERS — LEFT FOR YOU TO PRACTICE 🏋️
//  Hint: Query ProductAnalytics sorted by totalSales desc,
//        then fetch matching products preserving sort order
//  Route: GET /product/best-sellers
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
//  TODO: NEAR YOU — LEFT FOR YOU TO PRACTICE 🏋️
//  Hint: Use $near with $geometry on the location field
//        Accept lat, lng, radius (km) from query params
//        Convert km to meters for $maxDistance
//  Route: GET /product/near-me?lat=19.07&lng=72.87&radius=25
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
//  TODO: UPDATE PRODUCT — LEFT FOR YOU TO PRACTICE 🏋️
//  Hint: PATCH /product/:id  (auth required)
//        Verify req.user._id === product.userId (owner check)
//        Use findByIdAndUpdate with { new: true, runValidators: true }
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
//  TODO: DELETE PRODUCT — LEFT FOR YOU TO PRACTICE 🏋️
//  Hint: DELETE /product/:id  (auth required)
//        Verify ownership, then cascade-delete:
//        ProductAnalytics, Reviews for this product
// ═══════════════════════════════════════════════════


module.exports = {
    addProduct,
    search,
    getProductById,
    getTopRated,
    getByCategory,
    getBySubCategory,
    getHomeFeed,
    getMyProducts,
    getSellerProducts,
};

