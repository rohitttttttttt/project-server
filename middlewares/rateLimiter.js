const rateLimit = require('express-rate-limit')

const globalLimitter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,    // return rate limit info in headers
    legacyHeaders: false,     // disable X-RateLimit-* headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    }
})

const loginLimitter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,    // return rate limit info in headers
    legacyHeaders: false,     // disable X-RateLimit-* headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    }
})

const apiLimitter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,    // return rate limit info in headers
    legacyHeaders: false,     // disable X-RateLimit-* headers
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later."
    }
})



module.exports = {globalLimitter , loginLimitter , apiLimitter}