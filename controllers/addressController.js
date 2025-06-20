const Address = require('../models/Address');

// Get all addresses for a user
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id });
        res.render('addresses', { addresses });
    } catch (error) {
        req.flash('error', 'Error loading addresses');
        res.redirect('/');
    }
};

// Add new address
exports.addAddress = async (req, res) => {
    try {
        const { fullname, phone, street, city, state, postalCode, country } = req.body;

        const address = new Address({
            user: req.user._id,
            fullname,
            phone,
            street,
            city,
            state,
            postalCode,
            country
        });

        await address.save();

        req.flash('success', 'Address added successfully');
        res.redirect('/addresses');
    } catch (error) {
        req.flash('error', 'Error adding address');
        res.redirect('/addresses');
    }
};

// Update address
exports.updateAddress = async (req, res) => {
    try {
        const { fullname, phone, street, city, state, postalCode, country } = req.body;

        const address = await Address.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { fullname, phone, street, city, state, postalCode, country },
            { new: true }
        );

        if (!address) {
            req.flash('error', 'Address not found');
            return res.redirect('/addresses');
        }

        req.flash('success', 'Address updated successfully');
        res.redirect('/addresses');
    } catch (error) {
        req.flash('error', 'Error updating address');
        res.redirect('/addresses');
    }
};

// Delete address
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!address) {
            req.flash('error', 'Address not found');
            return res.redirect('/addresses');
        }

        req.flash('success', 'Address deleted successfully');
        res.redirect('/addresses');
    } catch (error) {
        req.flash('error', 'Error deleting address');
        res.redirect('/addresses');
    }
};

// Get address for editing
exports.getAddressForEdit = async (req, res) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!address) {
            req.flash('error', 'Address not found');
            return res.redirect('/addresses');
        }

        res.json(address);
    } catch (error) {
        res.status(500).json({ error: 'Error loading address' });
    }
}; 