const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config")

const productsModel = require("../models/productmodel");

router.post("/create", upload.single("image"), async function (req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor, quantity, description } = req.body;

        let product = await productsModel.create({
            image: req.file ? req.file.buffer : undefined,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
            quantity: parseInt(quantity, 10),
            description,
        });

        req.flash("seccuess", "Product created successfully.");
        res.redirect("/owner/admin");
    } catch (err) {
        res.send(err.message);
    }
});

module.exports = router;