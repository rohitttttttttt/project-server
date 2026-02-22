const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    phoneNo: {
        type: Number,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    postalCode: {
        type: Number,
        required: true,
    },
    land: {
        type: String,
        default: '',
    },
    addressLine: {
        type: String,
        required: true,
    },
    lat: {
        type: Number,
    },
    long: {
        type: Number,
    },
}, { timestamps: true });
addressSchema.index({ userId: 1 },{unique: true});
const Address = mongoose.model('Address', addressSchema);
module.exports = Address;
