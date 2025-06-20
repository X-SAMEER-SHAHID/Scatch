const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Cart must belong to a user']
    },
    items: [{
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Cart item must have a product']
        },
        quantity: {
            type: Number,
            required: [true, 'Cart item must have a quantity'],
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: [true, 'Cart item must have a price']
        },
        variant: {
            type: mongoose.Schema.ObjectId,
            ref: 'ProductVariant'
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String,
        giftWrap: {
            type: Boolean,
            default: false
        },
        giftMessage: String
    }],
    subtotal: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        default: 0
    },
    coupon: {
        type: mongoose.Schema.ObjectId,
        ref: 'Coupon'
    },
    giftCard: {
        type: mongoose.Schema.ObjectId,
        ref: 'GiftCard'
    },
    shippingMethod: {
        type: String,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
    },
    shippingAddress: {
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            required: true
        },
        street: {
            type: String,
            required: [true, 'Please provide street address']
        },
        city: {
            type: String,
            required: [true, 'Please provide city']
        },
        state: {
            type: String,
            required: [true, 'Please provide state']
        },
        country: {
            type: String,
            required: [true, 'Please provide country']
        },
        zipCode: {
            type: String,
            required: [true, 'Please provide zip code']
        }
    },
    billingAddress: {
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            required: true
        },
        street: {
            type: String,
            required: [true, 'Please provide street address']
        },
        city: {
            type: String,
            required: [true, 'Please provide city']
        },
        state: {
            type: String,
            required: [true, 'Please provide state']
        },
        country: {
            type: String,
            required: [true, 'Please provide country']
        },
        zipCode: {
            type: String,
            required: [true, 'Please provide zip code']
        }
    },
    paymentMethod: {
        type: {
            type: String,
            enum: ['card', 'paypal'],
            required: true
        },
        last4: String,
        brand: String
    },
    status: {
        type: String,
        enum: ['active', 'abandoned', 'converted'],
        default: 'active'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    },
    meta: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ status: 1 });
cartSchema.index({ expiresAt: 1 });

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
    return this.items.reduce((count, item) => count + item.quantity, 0);
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function (next) {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
    this.lastUpdated = new Date();
    next();
});

// Method to add item to cart
cartSchema.methods.addItem = async function (productId, quantity = 1, options = {}) {
    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        throw new Error('Insufficient stock');
    }

    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString() &&
        (!item.variant || !options.variant || item.variant.toString() === options.variant.toString())
    );

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.price = product.price;
        if (options.notes) existingItem.notes = options.notes;
        if (options.giftWrap) existingItem.giftWrap = options.giftWrap;
        if (options.giftMessage) existingItem.giftMessage = options.giftMessage;
    } else {
        this.items.push({
            product: productId,
            quantity: quantity,
            price: product.price,
            variant: options.variant,
            notes: options.notes,
            giftWrap: options.giftWrap || false,
            giftMessage: options.giftMessage
        });
    }

    return await this.save();
};

// Method to update item quantity
cartSchema.methods.updateQuantity = async function (productId, quantity, variant = null) {
    const item = this.items.find(item =>
        item.product.toString() === productId.toString() &&
        (!variant || !item.variant || item.variant.toString() === variant.toString())
    );

    if (!item) {
        throw new Error('Item not found in cart');
    }

    const Product = mongoose.model('Product');
    const product = await Product.findById(productId);

    if (!product) {
        throw new Error('Product not found');
    }

    if (product.stock < quantity) {
        throw new Error('Insufficient stock');
    }

    item.quantity = quantity;
    return await this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function (productId, variant = null) {
    this.items = this.items.filter(item =>
        !(item.product.toString() === productId.toString() &&
            (!variant || !item.variant || item.variant.toString() === variant.toString()))
    );
    return await this.save();
};

// Method to clear cart
cartSchema.methods.clear = async function () {
    this.items = [];
    this.subtotal = 0;
    this.tax = 0;
    this.shippingCost = 0;
    this.discount = 0;
    this.total = 0;
    this.coupon = null;
    this.giftCard = null;
    return await this.save();
};

// Method to apply coupon
cartSchema.methods.applyCoupon = async function (couponCode) {
    const Coupon = mongoose.model('Coupon');
    const coupon = await Coupon.findOne({ code: couponCode });

    if (!coupon) {
        throw new Error('Coupon not found');
    }

    if (!coupon.isValidForCart(this)) {
        throw new Error('Coupon is not valid for this cart');
    }

    this.coupon = coupon._id;
    this.discount = coupon.calculateDiscount(this.subtotal);
    return await this.save();
};

// Method to remove coupon
cartSchema.methods.removeCoupon = async function () {
    this.coupon = null;
    this.discount = 0;
    return await this.save();
};

// Method to apply gift card
cartSchema.methods.applyGiftCard = async function (giftCardCode) {
    const GiftCard = mongoose.model('GiftCard');
    const giftCard = await GiftCard.findOne({ code: giftCardCode });

    if (!giftCard) {
        throw new Error('Gift card not found');
    }

    if (!giftCard.isValid) {
        throw new Error('Gift card is not valid');
    }

    this.giftCard = giftCard._id;
    this.discount += giftCard.balance;
    return await this.save();
};

// Method to remove gift card
cartSchema.methods.removeGiftCard = async function () {
    if (this.giftCard) {
        const GiftCard = mongoose.model('GiftCard');
        const giftCard = await GiftCard.findById(this.giftCard);
        if (giftCard) {
            this.discount -= giftCard.balance;
        }
        this.giftCard = null;
    }
    return await this.save();
};

// Method to convert cart to order
cartSchema.methods.convertToOrder = async function () {
    const Order = mongoose.model('Order');

    const order = new Order({
        user: this.user,
        items: this.items,
        shippingAddress: this.shippingAddress,
        billingAddress: this.billingAddress,
        paymentMethod: this.paymentMethod,
        subtotal: this.subtotal,
        tax: this.tax,
        shippingCost: this.shippingCost,
        discount: this.discount,
        total: this.total,
        couponApplied: this.coupon,
        giftCardApplied: this.giftCard
    });

    await order.save();
    this.status = 'converted';
    await this.save();

    return order;
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 