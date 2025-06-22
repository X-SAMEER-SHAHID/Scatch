const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const path = require("path");
const flash = require("connect-flash");
const expressSession = require("express-session");
const multer = require("multer");
const isLoggedIn = require('./middlewares/isLoggedIn');

require("dotenv").config();

const ownersRouter = require("./routes/ownersRouter");
const usersRouter = require("./routes/usersRouter");
const productsRouter = require("./routes/productsRouter");
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/authRoutes");
const inventoryRouter = require("./routes/inventoryRouter");
const cartRoutes = require("./routes/cartRoutes");
const adminRoutes = require("./routes/adminRoutes");

const db = require("./config/mongoose-connection")

// Debug middleware - log all requests
app.use((req, res, next) => {
    console.log('Incoming Request:', {
        method: req.method,
        url: req.url,
        originalUrl: req.originalUrl,
        baseUrl: req.baseUrl,
        path: req.path,
        body: req.body,
        headers: req.headers
    });
    next();
});

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
    expressSession({
        secret: process.env.EXPRESS_SESSION_SECRET || 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    })
);

app.use(flash());

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine', 'ejs')

// Make user data available to all templates
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.isAuthenticated = !!req.user;
    next();
});

// Auth routes must be first to handle /auth/* properly
app.use("/auth", authRoutes);

// Public routes that don't require authentication
app.use("/", indexRoutes);

// Protected routes that require authentication
app.use("/owner", isLoggedIn, ownersRouter);
app.use("/users", isLoggedIn, usersRouter);
app.use("/products", isLoggedIn, productsRouter);
app.use("/inventory", isLoggedIn, inventoryRouter);
app.use("/cart", isLoggedIn, cartRoutes);
app.use("/admin", isLoggedIn, adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', { error: 'Something broke!' });
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.url);
    res.status(404).render('error', { error: 'Page not found' });
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});