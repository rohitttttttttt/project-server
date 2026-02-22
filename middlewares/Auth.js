const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const auth = async (req, res, next) => {
    try {
        // ---- Extract token from header or cookie ----
        const accessToken =
            req.headers['authorization']?.replace('Bearer ', '').trim() ||
            req.cookies?.accessToken;

        if (!accessToken) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        // ---- Verify token ----
        const decoded = jwt.verify(accessToken, process.env.ATS);

        const user = await User.findById(decoded._id).select(
            '-password -refreshToken'
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User associated with this token no longer exists',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please refresh your token.',
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Authentication failed',
        });
    }
};

module.exports = auth;