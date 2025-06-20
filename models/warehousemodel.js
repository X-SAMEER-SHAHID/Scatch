const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Warehouse name is required']
    },
    code: {
        type: String,
        required: [true, 'Warehouse code is required'],
        unique: true
    },
    type: {
        type: String,
        enum: [
            'main',
            'regional',
            'distribution',
            'fulfillment',
            'retail',
            'cross_dock',
            'cold_storage'
        ],
        required: [true, 'Warehouse type is required']
    },
    status: {
        type: String,
        enum: [
            'active',
            'inactive',
            'maintenance',
            'closed',
            'planned'
        ],
        default: 'active'
    },
    address: {
        street: {
            type: String,
            required: [true, 'Street address is required']
        },
        city: {
            type: String,
            required: [true, 'City is required']
        },
        state: {
            type: String,
            required: [true, 'State is required']
        },
        postalCode: {
            type: String,
            required: [true, 'Postal code is required']
        },
        country: {
            type: String,
            required: [true, 'Country is required']
        },
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    contact: {
        name: String,
        email: String,
        phone: String,
        fax: String
    },
    capacity: {
        total: Number, // in square feet/meters
        used: Number,
        reserved: Number,
        available: Number
    },
    operatingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    services: [{
        type: {
            type: String,
            enum: [
                'storage',
                'fulfillment',
                'cross_docking',
                'returns_processing',
                'quality_control',
                'repackaging',
                'labeling',
                'assembly',
                'kitting'
            ]
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        capacity: Number,
        currentLoad: Number
    }],
    equipment: [{
        type: {
            type: String,
            enum: [
                'forklift',
                'pallet_jack',
                'conveyor',
                'shelving',
                'racking',
                'dock_doors',
                'loading_equipment'
            ]
        },
        quantity: Number,
        status: {
            type: String,
            enum: ['available', 'in_use', 'maintenance', 'out_of_service']
        },
        lastMaintenance: Date,
        nextMaintenance: Date
    }],
    staff: {
        total: Number,
        available: Number,
        roles: [{
            type: String,
            count: Number
        }]
    },
    zones: [{
        name: String,
        type: {
            type: String,
            enum: [
                'receiving',
                'storage',
                'picking',
                'packing',
                'shipping',
                'returns',
                'quality_control'
            ]
        },
        capacity: Number,
        used: Number,
        temperature: {
            min: Number,
            max: Number,
            current: Number
        },
        humidity: {
            min: Number,
            max: Number,
            current: Number
        },
        security: {
            level: {
                type: String,
                enum: ['low', 'medium', 'high']
            },
            access: [String]
        }
    }],
    inventory: {
        totalItems: Number,
        totalValue: Number,
        categories: [{
            category: {
                type: mongoose.Schema.ObjectId,
                ref: 'Category'
            },
            count: Number,
            value: Number
        }],
        lastCount: Date,
        nextCount: Date
    },
    performance: {
        orderFulfillment: {
            total: Number,
            onTime: Number,
            late: Number,
            accuracy: Number
        },
        receiving: {
            total: Number,
            onTime: Number,
            late: Number,
            accuracy: Number
        },
        shipping: {
            total: Number,
            onTime: Number,
            late: Number,
            accuracy: Number
        },
        returns: {
            total: Number,
            processed: Number,
            pending: Number,
            accuracy: Number
        }
    },
    maintenance: {
        schedule: [{
            type: {
                type: String,
                enum: [
                    'routine',
                    'preventive',
                    'corrective',
                    'emergency'
                ]
            },
            description: String,
            status: {
                type: String,
                enum: [
                    'scheduled',
                    'in_progress',
                    'completed',
                    'cancelled'
                ]
            },
            startDate: Date,
            endDate: Date,
            assignedTo: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            notes: String
        }],
        lastInspection: Date,
        nextInspection: Date
    },
    security: {
        access: {
            type: String,
            enum: ['public', 'restricted', 'private']
        },
        cameras: Number,
        guards: Number,
        alarms: Number,
        lastAudit: Date,
        nextAudit: Date
    },
    compliance: {
        certifications: [{
            type: String,
            name: String,
            issuer: String,
            issueDate: Date,
            expiryDate: Date,
            status: {
                type: String,
                enum: ['active', 'expired', 'pending']
            }
        }],
        lastAudit: Date,
        nextAudit: Date
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
warehouseSchema.index({ name: 1 });
warehouseSchema.index({ code: 1 });
warehouseSchema.index({ type: 1 });
warehouseSchema.index({ status: 1 });
warehouseSchema.index({ 'address.country': 1 });
warehouseSchema.index({ 'address.state': 1 });
warehouseSchema.index({ 'address.city': 1 });

// Virtual for is operational
warehouseSchema.virtual('isOperational').get(function () {
    return this.status === 'active';
});

// Virtual for capacity utilization
warehouseSchema.virtual('capacityUtilization').get(function () {
    if (!this.capacity.total) return 0;
    return (this.capacity.used / this.capacity.total) * 100;
});

// Method to update capacity
warehouseSchema.methods.updateCapacity = async function (used, reserved) {
    this.capacity.used = used;
    this.capacity.reserved = reserved;
    this.capacity.available = this.capacity.total - used - reserved;
    return await this.save();
};

// Method to add maintenance record
warehouseSchema.methods.addMaintenance = async function (data) {
    this.maintenance.schedule.push(data);
    return await this.save();
};

// Method to update maintenance status
warehouseSchema.methods.updateMaintenanceStatus = async function (maintenanceId, status) {
    const maintenance = this.maintenance.schedule.id(maintenanceId);
    if (!maintenance) {
        throw new Error('Maintenance record not found');
    }

    maintenance.status = status;
    if (status === 'completed') {
        maintenance.endDate = new Date();
    }

    return await this.save();
};

// Method to update performance metrics
warehouseSchema.methods.updatePerformance = async function (metrics) {
    Object.assign(this.performance, metrics);
    return await this.save();
};

// Method to update inventory metrics
warehouseSchema.methods.updateInventoryMetrics = async function () {
    const Inventory = mongoose.model('Inventory');

    const inventory = await Inventory.find({
        'location.warehouse': this._id
    });

    this.inventory.totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    this.inventory.totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.costs.purchase), 0);

    // Update category metrics
    const categoryMetrics = {};
    inventory.forEach(item => {
        if (item.product.category) {
            if (!categoryMetrics[item.product.category]) {
                categoryMetrics[item.product.category] = {
                    count: 0,
                    value: 0
                };
            }
            categoryMetrics[item.product.category].count += item.quantity;
            categoryMetrics[item.product.category].value += item.quantity * item.costs.purchase;
        }
    });

    this.inventory.categories = Object.entries(categoryMetrics).map(([category, metrics]) => ({
        category,
        count: metrics.count,
        value: metrics.value
    }));

    return await this.save();
};

// Static method to create warehouse
warehouseSchema.statics.create = async function (data) {
    const warehouse = new this(data);
    warehouse.capacity.available = warehouse.capacity.total;
    return await warehouse.save();
};

// Static method to get active warehouses
warehouseSchema.statics.getActive = async function () {
    return await this.find({ status: 'active' });
};

// Static method to get warehouses by type
warehouseSchema.statics.getByType = async function (type) {
    return await this.find({ type });
};

// Static method to get warehouses by location
warehouseSchema.statics.getByLocation = async function (country, state, city) {
    const query = {};
    if (country) query['address.country'] = country;
    if (state) query['address.state'] = state;
    if (city) query['address.city'] = city;

    return await this.find(query);
};

// Static method to get warehouses with low capacity
warehouseSchema.statics.getLowCapacity = async function (threshold = 20) {
    return await this.find({
        $expr: {
            $lte: [
                {
                    $multiply: [
                        { $divide: ['$capacity.used', '$capacity.total'] },
                        100
                    ]
                },
                threshold
            ]
        }
    });
};

// Static method to get warehouses needing maintenance
warehouseSchema.statics.getNeedingMaintenance = async function () {
    const now = new Date();
    return await this.find({
        'maintenance.nextInspection': { $lte: now }
    });
};

const Warehouse = mongoose.model('Warehouse', warehouseSchema);

module.exports = Warehouse; 