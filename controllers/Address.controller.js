const mongoose = require('mongoose');
const Address = require('../models/Address.model');

// ═══════════════════════════════════════════════════
//  ADD ADDRESS  (POST /address)
//  Auth required — one address per user (unique userId)
// ═══════════════════════════════════════════════════
const addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { fullName, phoneNo, state, city, postalCode, land, addressLine, lat, long } = req.body;

        // ── Input validation ──
        if (!fullName || !phoneNo || !state || !city || !postalCode || !addressLine) {
            return res.status(400).json({
                success: false,
                message: 'fullName, phoneNo, state, city, postalCode, and addressLine are required',
            });
        }
        if (typeof fullName !== 'string' || typeof state !== 'string' || typeof city !== 'string' || typeof addressLine !== 'string') {
            return res.status(400).json({ success: false, message: 'fullName, state, city, and addressLine must be strings' });
        }
        if (typeof phoneNo !== 'number' || typeof postalCode !== 'number') {
            return res.status(400).json({ success: false, message: 'phoneNo and postalCode must be numbers' });
        }

        // ── Check if user already has an address ──
        const existing = await Address.findOne({ userId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'Address already exists. Use update instead.',
            });
        }

        const address = new Address({
            userId,
            fullName: fullName.trim(),
            phoneNo,
            state: state.trim(),
            city: city.trim(),
            postalCode,
            land: land ? land.trim() : '',
            addressLine: addressLine.trim(),
            lat: lat || undefined,
            long: long || undefined,
        });
        await address.save();

        return res.status(201).json({
            success: true,
            message: 'Address added successfully',
            address,
        });
    } catch (error) {
        console.error('AddAddress Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  GET MY ADDRESS  (GET /address)
//  Auth required
// ═══════════════════════════════════════════════════
const getMyAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const address = await Address.findOne({ userId });
        if (!address) {
            return res.status(404).json({ success: false, message: 'No address found' });
        }

        return res.status(200).json({ success: true, address });
    } catch (error) {
        console.error('GetMyAddress Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  UPDATE ADDRESS  (PATCH /address)
//  Auth required — updates the user's single address
// ═══════════════════════════════════════════════════
const updateAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const address = await Address.findOne({ userId });
        if (!address) {
            return res.status(404).json({ success: false, message: 'No address found. Create one first.' });
        }

        const allowedFields = ['fullName', 'phoneNo', 'state', 'city', 'postalCode', 'land', 'addressLine', 'lat', 'long'];
        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        // ── Type checks on provided fields ──
        if (updates.fullName !== undefined && typeof updates.fullName !== 'string') {
            return res.status(400).json({ success: false, message: 'fullName must be a string' });
        }
        if (updates.state !== undefined && typeof updates.state !== 'string') {
            return res.status(400).json({ success: false, message: 'state must be a string' });
        }
        if (updates.city !== undefined && typeof updates.city !== 'string') {
            return res.status(400).json({ success: false, message: 'city must be a string' });
        }
        if (updates.addressLine !== undefined && typeof updates.addressLine !== 'string') {
            return res.status(400).json({ success: false, message: 'addressLine must be a string' });
        }
        if (updates.phoneNo !== undefined && typeof updates.phoneNo !== 'number') {
            return res.status(400).json({ success: false, message: 'phoneNo must be a number' });
        }
        if (updates.postalCode !== undefined && typeof updates.postalCode !== 'number') {
            return res.status(400).json({ success: false, message: 'postalCode must be a number' });
        }

        // Trim string fields
        if (updates.fullName) updates.fullName = updates.fullName.trim();
        if (updates.state) updates.state = updates.state.trim();
        if (updates.city) updates.city = updates.city.trim();
        if (updates.addressLine) updates.addressLine = updates.addressLine.trim();
        if (updates.land) updates.land = updates.land.trim();

        const updatedAddress = await Address.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address: updatedAddress,
        });
    } catch (error) {
        console.error('UpdateAddress Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ═══════════════════════════════════════════════════
//  DELETE ADDRESS  (DELETE /address)
//  Auth required
// ═══════════════════════════════════════════════════
const deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;

        const address = await Address.findOneAndDelete({ userId });
        if (!address) {
            return res.status(404).json({ success: false, message: 'No address found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (error) {
        console.error('DeleteAddress Error:', error.message);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress,
};
