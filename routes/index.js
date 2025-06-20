const express = require("express")
const router = express.Router();
const productsModel = require("../models/Product")
const isLoggedIn = require("../middlewares/isLoggedIn");
const usermodel = require("../models/usermodel");

router.get("/", (req, res) => {
    let error = req.flash("error",);
    res.render("index", { error, loggedin: false });
});

router.get("/shop", isLoggedIn, async (req, res) => {
    try {
        let products = await productsModel.find();
        let success = req.flash("success") || [];
        res.render("shop", { products, success });
    } catch (error) {
        req.flash("error", "Error loading products");
        res.redirect("/");
    }
})

router.get("/cart", isLoggedIn, async (req, res) => {
    try {
        let user = await usermodel.findOne({ email: req.user.email }).populate("cart");
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/");
        }
        if (!user.cart || user.cart.length < 1) {
            req.flash("success", "Add something in the cart first.");
            return res.redirect("/shop");
        }
        
        // Calculate total for all items
        let total = user.cart.reduce((sum, item) => {
            return sum + (item.price - (item.discount || 0));
        }, 0);
        
        // Add shipping cost
        total += 20; // shipping cost
        
        res.render("cart", { user, total });

    } catch (error) {
        req.flash("error", "Error loading cart");
        res.redirect("/");
    }
})

router.get("/addtocart/:id", isLoggedIn, async (req, res) => {

    try {
        let user = await usermodel.findOne({ email: req.user.email });
        if (!user) {
            req.flash("error", "User not found");
            return res.redirect("/");
        }

        // Check if product exists
        const product = await productsModel.findById(req.params.id);
        if (!product) {
            req.flash("error", "Product not found");
            return res.redirect("/shop");
        }

        user.cart.push(req.params.id);
        await user.save();
        req.flash("success", "Item added successfully.");
        return res.redirect("/shop");
    } catch (error) {
        req.flash("error", error.message);
        return res.redirect("/shop");
    }
});

module.exports = router;