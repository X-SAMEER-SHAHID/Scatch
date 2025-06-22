const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const productSchema = mongoose.Schema({
    image: Buffer,
    titleImage: Buffer,
    name: String,
    price: Number,
    discount: {
        type: Number,
        default: 0
    },
    bgcolor: String,
    panelcolor: String,
    textcolor: String,
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    dateAdded: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    },
    reviews: [reviewSchema]
});

module.exports = mongoose.model("Product", productSchema);