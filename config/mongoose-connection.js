const mongoose = require('mongoose');
require('dotenv').config();
// const dbgr = require("debug")("development:mongoose");

// console.log(process.env.DEBUG);

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/scatch';

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(function () {
        console.log('Connected to MongoDB:', mongoUri);
    })
    .catch(function (err) {
        console.error('MongoDB connection error:', err);
    });

module.exports = mongoose.connection;