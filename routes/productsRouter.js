const express = require("express");
const router = express.Router();
const upload = require("../config/multer-config")

const productsModel = require("../models/Product");

router.post("/create", upload.single("image"), async function (req, res) {
    try {
        let { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        let product = await productsModel.create({
            image: req.file.buffer,
            name,
            price,
            discount,
            bgcolor,
            panelcolor,
            textcolor,
        });

        req.flash("seccuess", "Product created successfully.");
        res.redirect("/owner/admin");
    } catch {
        res.send(err.message);
    }
});

module.exports = router;