const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        },
        phone: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        role: {
            type: String,
            enum: ['user', 'farmer'],
            default: 'user',
        },
        refreshToken: {
            type: String,
            select: false,
        },
    },
    { timestamps: true }
);

// --- Validation: at least one of email or phone must be provided ---
userSchema.pre('validate', function (next) {
    if (!this.email && !this.phone) {
        return next(new Error('At least one of email or phone is required'));
    }
    next();
});

// --- Hash password before saving ---
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// --- Compare password ---
userSchema.methods.isPassCorrect = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// --- Generate Access Token (short-lived) ---
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { _id: this._id, role: this.role },
        process.env.ATS,
        { expiresIn: '1d' }
    );
};

// --- Generate Refresh Token (long-lived) ---
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.RTS,
        { expiresIn: '7d' }
    );
};
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
const User = mongoose.model('User', userSchema);
module.exports = User;