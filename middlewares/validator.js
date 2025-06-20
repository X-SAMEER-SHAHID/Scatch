const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(err => err.msg);
        return next(new AppError(errorMessages.join(', '), 400));
    }
    next();
};

// User validation rules
const userValidationRules = {
    register: [
        {
            field: 'email',
            rules: [
                { type: 'isEmail', message: 'Please provide a valid email address' },
                { type: 'notEmpty', message: 'Email is required' }
            ]
        },
        {
            field: 'password',
            rules: [
                { type: 'isLength', options: { min: 8 }, message: 'Password must be at least 8 characters long' },
                {
                    type: 'matches', options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                }
            ]
        },
        {
            field: 'name',
            rules: [
                { type: 'notEmpty', message: 'Name is required' },
                { type: 'isLength', options: { min: 2 }, message: 'Name must be at least 2 characters long' }
            ]
        }
    ],
    login: [
        {
            field: 'email',
            rules: [
                { type: 'isEmail', message: 'Please provide a valid email address' },
                { type: 'notEmpty', message: 'Email is required' }
            ]
        },
        {
            field: 'password',
            rules: [
                { type: 'notEmpty', message: 'Password is required' }
            ]
        }
    ]
};

// Product validation rules
const productValidationRules = {
    create: [
        {
            field: 'name',
            rules: [
                { type: 'notEmpty', message: 'Product name is required' },
                { type: 'isLength', options: { min: 3 }, message: 'Product name must be at least 3 characters long' }
            ]
        },
        {
            field: 'price',
            rules: [
                { type: 'isFloat', options: { min: 0 }, message: 'Price must be a positive number' },
                { type: 'notEmpty', message: 'Price is required' }
            ]
        },
        {
            field: 'description',
            rules: [
                { type: 'notEmpty', message: 'Description is required' },
                { type: 'isLength', options: { min: 10 }, message: 'Description must be at least 10 characters long' }
            ]
        }
    ]
};

// Order validation rules
const orderValidationRules = {
    create: [
        {
            field: 'items',
            rules: [
                { type: 'isArray', message: 'Order items must be an array' },
                { type: 'notEmpty', message: 'Order items are required' }
            ]
        },
        {
            field: 'shippingAddress',
            rules: [
                { type: 'notEmpty', message: 'Shipping address is required' }
            ]
        }
    ]
};

module.exports = {
    validate,
    userValidationRules,
    productValidationRules,
    orderValidationRules
}; 