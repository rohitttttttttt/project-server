const mongoose = require('mongoose');
const Product = require("../models/Product.model");
const User = require("../models/User.model");
const Category = require("../models/Category.model");
const Address = require("../models/Address.model");
const ProductAnalytics = require("../models/ProductAnalytics.model");
const Review = require("../models/Review.model");

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
const LITE_SELECT = 'title price unit averageRating numberOfReviews isOrganic images';

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
        const products = await Product.find(query).select(LITE_SELECT + ' score').select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).skip(skip).limit(limit);

        let recommendedProducts 
        if(products.length < 10){
            recommendedProducts = await Product.find({
                $text: { $search: searchQuery },
                ...(category && {categoryId : category}),
                _id :{$nin : products.map(product => product._id)}
                
            }).select(LITE_SELECT).sort({ score: { $meta: "textScore" } }).limit(10 - products.length);
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

const getNearByProducts = async (req , res)=>{
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
        const products  = await Product.find({
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

const getLatestProducts = async (req , res)=>{
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;
        const products = await Product.find().sort({createdAt:-1}).select(LITE_SELECT).skip(skip).limit(limit)

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
const getTopRatedProducts = async (req , res)=>{
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;
       
        const products = await Product.find().sort({averageRating:-1 , numberOfReviews: -1}).select(LITE_SELECT).skip(skip).limit(limit)

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
const getOrganicProducts = async (req , res)=>{
    try {
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const skip = (page - 1) * limit;
       
        const products = await Product.find({isOrganic:true}).sort({averageRating:-1 , numberOfReviews: -1}).select(LITE_SELECT).skip(skip).limit(limit)

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
        const { latitude, longitude } = req.query;

        // Best-seller aggregation pipeline (top 4 by weighted score)
        const bestSellerPipeline = [
            {
                $addFields: {
                    score: {
                        $add: [
                            { $multiply: ["$totalSales", 0.5] },
                            { $multiply: ["$addToCartCount", 0.3] },
                            { $multiply: ["$productViews", 0.2] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 4 },
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            { $replaceRoot: { newRoot: "$product" } }
        ];

        // Near-you query (only if coordinates provided)
        let nearYouPromise = Promise.resolve([]);
        if (latitude && longitude) {
            const lng = Number(longitude);
            const lat = Number(latitude);
            if (!isNaN(lng) && !isNaN(lat)) {
                nearYouPromise = Product.find({
                    location: {
                        $near: {
                            $geometry: { type: "Point", coordinates: [lng, lat] }
                        }
                    }
                })
                    .limit(4)
                    .select(LITE_SELECT)
                    .lean();
            }
        }

        const [freshlyAdded, topRated, organic, bestSeller, nearYou] = await Promise.all([
            Product.find()
                .sort({ createdAt: -1 })
                .limit(4)
                .select(LITE_SELECT)
                .lean(),
            Product.find({ averageRating: { $gte: 4 }, numberOfReviews: { $gte: 1 } })
                .sort({ averageRating: -1 })
                .limit(4)
                .select(LITE_SELECT)
                .lean(),
            Product.find({ isOrganic: true })
                .sort({ createdAt: -1 })
                .limit(4)
                .select(LITE_SELECT)
                .lean(),
            ProductAnalytics.aggregate(bestSellerPipeline),
            nearYouPromise,
        ]);

        const categories = await Category.find().select('Category subCategory').lean();

        return res.status(200).json({
            success: true,
            sections: { topRated, bestSeller, nearYou, organic, freshlyAdded },
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
const getBestSellers = async (req , res)=>{
    try {
        const page = req.query.page || 1 ;
        const limit = req.query.limit || 10 ;
        const skip = (page  - 1 ) * limit || 0 ;
        const products = await ProductAnalytics.aggregate([
            {
                $addFields: {
                    score: {
                        $add: [
                            { $multiply: ["$totalSales", 0.5] },
                            { $multiply: ["$addToCartCount", 0.3] },
                            { $multiply: ["$productViews", 0.2] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $skip: skip },
            { $limit: limit },

            
            {
                $lookup: {
                    from: "products",
                    localField: "productId",
                    foreignField: "_id",
                    as: "product"
                }
            },

            // CONVERT ARRAY → OBJECT
            { $unwind: "$product" },

            // IMPORTANT PART 
            {
                $project: {
                    _id: 0,
                    title: "$product.title",
                    price: "$product.price",
                    unit: "$product.unit",
                    averageRating: "$product.averageRating",
                    numberOfReviews: "$product.numberOfReviews",
                    isOrganic: "$product.isOrganic"
                }
            }
        ]);
        return res.status(200).json({
            success:true,
            products
        })       
    } catch (error) {
        return res.status(500).json({
            message:error.message
        })
    }
}
// ═══════════════════════════════════════════════════
//  UPDATE PRODUCT  (PATCH /product/:id)
//  Auth required — owner only
// ═══════════════════════════════════════════════════
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to update this product' });
        }

        const allowedFields = [
            'title', 'description', 'categoryId', 'subCategory',
            'price', 'unit', 'stock', 'minOrderQuantity',
            'images', 'isOrganic', 'isVeg', 'harvestDate', 'addressId'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        // Validate images array if provided
        if (updates.images) {
            if (!Array.isArray(updates.images) || updates.images.length > 5 || updates.images.length < 1) {
                return res.status(400).json({ success: false, message: 'Images must be an array with 1-5 items' });
            }
        }

        // Validate categoryId / subCategory if either is being changed
        if (updates.categoryId || updates.subCategory) {
            const catId = updates.categoryId || product.categoryId;
            const category = await Category.findById(catId);
            if (!category) {
                return res.status(400).json({ success: false, message: 'Category not found' });
            }
            const subCat = updates.subCategory || product.subCategory;
            if (!category.subCategory.includes(subCat)) {
                return res.status(400).json({ success: false, message: 'Sub-category not found in category' });
            }
        }

        // Validate addressId if provided and update location coordinates
        if (updates.addressId) {
            const address = await Address.findById(updates.addressId);
            if (!address) {
                return res.status(400).json({ success: false, message: 'Address not found' });
            }
            updates.location = {
                type: "Point",
                coordinates: [address.long, address.lat]
            };
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate(PRODUCT_POPULATE);

        return res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product: updatedProduct
        });
    } catch (error) {
        console.error('UpdateProduct Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  DELETE PRODUCT  (DELETE /product/:id)
//  Auth required — owner only, cascade-deletes analytics & reviews
// ═══════════════════════════════════════════════════
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid product ID' });
        }

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this product' });
        }

        // Cascade delete: remove analytics, reviews, and the product itself
        await Promise.all([
            ProductAnalytics.deleteMany({ productId: id }),
            Review.deleteMany({ productId: id }),
            Product.findByIdAndDelete(id)
        ]);

        return res.status(200).json({
            success: true,
            message: 'Product and related data deleted successfully'
        });
    } catch (error) {
        console.error('DeleteProduct Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
    addProduct,
    search,
    getNearByProducts,
    getLatestProducts,
    getTopRatedProducts,
    getOrganicProducts,
    getProductById,
    getByCategory,
    getBySubCategory,
    getHomeFeed,
    getMyProducts,
    getSellerProducts,
    getBestSellers,
    updateProduct,
    deleteProduct,
};
