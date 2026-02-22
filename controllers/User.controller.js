const User = require('../models/User.model');

// ───────────────────────────────────────────
//  Validation helpers
// ───────────────────────────────────────────
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/; // Indian mobile format

const isValidEmail = (email) => EMAIL_REGEX.test(email.trim());
const isValidPhone = (phone) => PHONE_REGEX.test(phone.trim());

// ───────────────────────────────────────────
//  Cookie options helper
// ───────────────────────────────────────────
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 1 day
};

// ───────────────────────────────────────────
//  SIGN UP — via email, phone, or both
// ───────────────────────────────────────────
const signUp = async (req, res) => {
    try {
        const { fullName, password, email, phone, role } = req.body;

        // ---- Basic validation ----
        if (!fullName || !password) {
            return res.status(400).json({
                success: false,
                message: 'fullName and password are required',
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'At least one of email or phone is required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        // ---- Format validation ----
        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format (e.g. user@example.com)',
            });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone format (10-digit Indian mobile, e.g. 9876543210)',
            });
        }

        // ---- Check for existing user ----
        const existingQuery = [];
        if (email) existingQuery.push({ email: email.toLowerCase().trim() });
        if (phone) existingQuery.push({ phone: phone.trim() });

        const existingUser = await User.findOne({ $or: existingQuery });
        if (existingUser) {
            const conflictField =
                email && existingUser.email === email.toLowerCase().trim()
                    ? 'email'
                    : 'phone';
            return res.status(409).json({
                success: false,
                message: `An account with this ${conflictField} already exists`,
            });
        }

        // ---- Create user ----
        const userData = { fullName, password };
        if (email) userData.email = email;
        if (phone) userData.phone = phone;
        userData.role = (role && ['user', 'farmer'].includes(role)) ? role : 'user';

        const user = await User.create(userData);

        // ---- Generate tokens ----
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // ---- Respond ----
        const safeUser = await User.findById(user._id).select(
            '-password -refreshToken -__v'
        );

        res.cookie('accessToken', accessToken, cookieOptions);
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: safeUser,
            accessToken,
        });
    } catch (error) {
        console.error('SignUp Error:', error.message);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', '),
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// ───────────────────────────────────────────
//  LOGIN — via email or phone + password
// ───────────────────────────────────────────
const login = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        // ---- Validate input ----
        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone is required to login',
            });
        }

        // ---- Format validation ----
        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format (e.g. user@example.com)',
            });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone format (10-digit Indian mobile, e.g. 9876543210)',
            });
        }

        // ---- Find user by email or phone ----
        const query = email
            ? { email: email.toLowerCase().trim() }
            : { phone: phone.trim() };

        const user = await User.findOne(query).select('+refreshToken');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // ---- Verify password ----
        const isPasswordValid = await user.isPassCorrect(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // ---- Generate tokens ----
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // ---- Respond ----
        const safeUser = await User.findById(user._id).select(
            '-password -refreshToken -__v'
        );

        res.cookie('accessToken', accessToken, cookieOptions);
        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user: safeUser,
            accessToken,
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// ───────────────────────────────────────────
//  LOGOUT
// ───────────────────────────────────────────
const logout = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $unset: { refreshToken: 1 },
        });

        res.clearCookie('accessToken', cookieOptions);
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        console.error('Logout Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// ───────────────────────────────────────────
//  REFRESH ACCESS TOKEN
// ───────────────────────────────────────────
const refreshAccessToken = async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body?.refreshToken;

        if (!incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(incomingRefreshToken, process.env.RTS);

        const user = await User.findById(decoded._id).select('+refreshToken');
        if (!user || user.refreshToken !== incomingRefreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token',
            });
        }

        // ---- Rotate tokens ----
        const newAccessToken = user.generateAccessToken();
        const newRefreshToken = user.generateRefreshToken();

        user.refreshToken = newRefreshToken;
        await user.save({ validateBeforeSave: false });

        res.cookie('accessToken', newAccessToken, cookieOptions);
        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken,
        });
    } catch (error) {
        console.error('Refresh Token Error:', error.message);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }
};

// ───────────────────────────────────────────
//  GET CURRENT USER (authenticated)
// ───────────────────────────────────────────
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select(
            '-password -refreshToken -__v'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('GetCurrentUser Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// ───────────────────────────────────────────
//  GET USER BY ID (public profile)
// ───────────────────────────────────────────
const getUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required',
            });
        }

        const user = await User.findById(id).select(
            '-password -refreshToken -__v'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('GetUser Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// ───────────────────────────────────────────
//  CHANGE PASSWORD
// ───────────────────────────────────────────
const changePassword = async (req , res)=>{
    try {

        // input validation 
        const {email , phone , password , newPassword} = req.body;
        if(!email &&  !phone){
            return res.status(400).json({
                success: false,
                message: 'Email or phone is required',
            })
        }
        if(!password ){
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            })
        }
        if(!newPassword){
            return res.status(400).json({
                success: false,
                message: 'New password is required',
            })
        }
        if(password === newPassword){
            return res.status(400).json({
                success: false,
                message: 'New password must be different from old password',
            })
        }
        if (newPassword.length < 6){
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
            })
        }

         // ---- Format validation ----
        if (email && !isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format (e.g. user@example.com)',
            });
        }

        if (phone && !isValidPhone(phone)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone format (10-digit Indian mobile, e.g. 9876543210)',
            });
        }
        const finder = email ? {email} : {phone}
        let user = await User.findOne(finder)
        if(!user){
            return res.status(404).json({
                success: false,
                message: 'User not found',
            })
        }

        const isPasswordCorrect = await user.isPassCorrect(password)
        if(!isPasswordCorrect){
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
            })
        }
        
        user.password = newPassword
        await user.save()
        return res.status(200).json({
            success: true,
            message: 'Password changed successfully',
        })

        
        
    } catch (error) {
        console.error('ChangePassword Error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        })
    }
}
module.exports = {
    signUp,
    login,
    logout,
    refreshAccessToken,
    getCurrentUser,
    getUser,
    changePassword,
}; 