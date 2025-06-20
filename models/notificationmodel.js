const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Notification must belong to a user']
    },
    type: {
        type: String,
        enum: [
            'order_status',
            'order_shipped',
            'order_delivered',
            'order_cancelled',
            'order_refunded',
            'payment_success',
            'payment_failed',
            'price_alert',
            'stock_alert',
            'review_approved',
            'review_rejected',
            'review_reply',
            'wishlist_item_on_sale',
            'wishlist_item_back_in_stock',
            'coupon_expiring',
            'gift_card_received',
            'gift_card_used',
            'gift_card_expiring',
            'account_verification',
            'password_reset',
            'security_alert',
            'system_announcement'
        ],
        required: [true, 'Notification must have a type']
    },
    title: {
        type: String,
        required: [true, 'Notification must have a title']
    },
    message: {
        type: String,
        required: [true, 'Notification must have a message']
    },
    data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'archived'],
        default: 'unread'
    },
    readAt: Date,
    archivedAt: Date,
    expiresAt: Date,
    action: {
        type: {
            type: String,
            enum: ['link', 'button', 'none'],
            default: 'none'
        },
        text: String,
        url: String
    },
    icon: String,
    image: {
        url: String,
        alt: String
    },
    category: {
        type: String,
        enum: ['order', 'payment', 'product', 'account', 'system'],
        required: [true, 'Notification must have a category']
    },
    channels: [{
        type: String,
        enum: ['email', 'sms', 'push', 'in_app'],
        required: [true, 'Notification must have at least one channel']
    }],
    deliveryStatus: {
        email: {
            sent: Boolean,
            sentAt: Date,
            error: String
        },
        sms: {
            sent: Boolean,
            sentAt: Date,
            error: String
        },
        push: {
            sent: Boolean,
            sentAt: Date,
            error: String
        }
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
notificationSchema.index({ user: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

// Virtual for is expired
notificationSchema.virtual('isExpired').get(function () {
    return this.expiresAt && new Date() > this.expiresAt;
});

// Virtual for is actionable
notificationSchema.virtual('isActionable').get(function () {
    return this.action.type !== 'none';
});

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    if (this.status === 'unread') {
        this.status = 'read';
        this.readAt = new Date();
        return await this.save();
    }
    return this;
};

// Method to mark as archived
notificationSchema.methods.archive = async function () {
    if (this.status !== 'archived') {
        this.status = 'archived';
        this.archivedAt = new Date();
        return await this.save();
    }
    return this;
};

// Method to mark as unread
notificationSchema.methods.markAsUnread = async function () {
    if (this.status !== 'unread') {
        this.status = 'unread';
        this.readAt = undefined;
        return await this.save();
    }
    return this;
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = async function (channel, status) {
    if (this.deliveryStatus[channel]) {
        this.deliveryStatus[channel] = {
            ...this.deliveryStatus[channel],
            ...status
        };
        return await this.save();
    }
    return this;
};

// Static method to create notification
notificationSchema.statics.create = async function (data) {
    const notification = new this(data);
    return await notification.save();
};

// Static method to create multiple notifications
notificationSchema.statics.createMany = async function (notifications) {
    return await this.insertMany(notifications);
};

// Static method to get unread notifications
notificationSchema.statics.getUnread = async function (userId) {
    return await this.find({
        user: userId,
        status: 'unread'
    }).sort({ createdAt: -1 });
};

// Static method to get recent notifications
notificationSchema.statics.getRecent = async function (userId, limit = 10) {
    return await this.find({
        user: userId,
        status: { $ne: 'archived' }
    })
        .sort({ createdAt: -1 })
        .limit(limit);
};

// Static method to mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
    return await this.updateMany(
        {
            user: userId,
            status: 'unread'
        },
        {
            $set: {
                status: 'read',
                readAt: new Date()
            }
        }
    );
};

// Static method to delete expired notifications
notificationSchema.statics.deleteExpired = async function () {
    return await this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 