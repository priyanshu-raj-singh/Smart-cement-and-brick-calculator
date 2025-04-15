const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    wallLength: {
        type: Number,
        required: true
    },
    wallHeight: {
        type: Number,
        required: true
    },
    wallThickness: {
        type: Number,
        required: true
    },
    wastage: {
        type: Number,
        required: true
    },
    results: {
        bricks: {
            type: Number,
            required: true
        },
        cement: {
            type: Number,
            required: true
        },
        sand: {
            type: Number,
            required: true
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Calculation', calculationSchema); 