# Scatch - Full-Featured E-Commerce Platform

A comprehensive e-commerce platform built with Node.js, Express, MongoDB, and EJS templating engine. Scatch provides a complete online shopping experience with advanced features for both customers and administrators.

## 🚀 Features

### Customer Features
- **User Authentication & Authorization**
  - User registration and login
  - Password reset functionality
  - Email verification
  - Google OAuth integration
  - Session management with security features

- **Product Management**
  - Browse products by categories and brands
  - Advanced product search and filtering
  - Product reviews and ratings
  - Wishlist functionality
  - Product images with multiple views

- **Shopping Experience**
  - Shopping cart with persistent storage
  - Add/remove items from cart
  - Quantity management
  - Real-time cart updates

- **Order Management**
  - Secure checkout process
  - Multiple payment methods (Credit Card, PayPal, Bank Transfer)
  - Order tracking and status updates
  - Order history
  - Email notifications for order updates

- **User Profile**
  - Personal information management
  - Multiple address management
  - Order history
  - Profile picture upload
  - Preference settings

### Administrative Features
- **Product Management**
  - Add, edit, and delete products
  - Inventory management
  - Category and brand management
  - Bulk product operations

- **Order Management**
  - Order processing and fulfillment
  - Status updates
  - Shipping management
  - Order analytics

- **Customer Management**
  - User account management
  - Customer support tools
  - User analytics

- **Marketing Tools**
  - Coupon and discount management
  - Gift card system
  - Email marketing integration
  - Notification system

### Technical Features
- **Security**
  - Rate limiting
  - XSS protection
  - CSRF protection
  - Input sanitization
  - Secure session management
  - Password hashing with bcrypt

- **Performance**
  - Response compression
  - Image optimization with Sharp
  - Caching with Redis
  - Database indexing

- **Payment Integration**
  - Stripe payment processing
  - Multiple payment gateways
  - Secure transaction handling

- **Communication**
  - Email notifications (Nodemailer)
  - SMS notifications (Twilio)
  - Real-time updates (Socket.io)

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for API authentication

### Frontend
- **EJS** - Embedded JavaScript templating
- **Bootstrap** - CSS framework (implied from structure)
- **JavaScript** - Client-side functionality

### Additional Libraries
- **bcrypt** - Password hashing
- **multer** - File upload handling
- **sharp** - Image processing
- **moment** - Date manipulation
- **winston** - Logging
- **express-validator** - Input validation
- **helmet** - Security headers
- **compression** - Response compression
- **cors** - Cross-origin resource sharing

### External Services
- **Stripe** - Payment processing
- **Twilio** - SMS services
- **Nodemailer** - Email services
- **Redis** - Caching and session storage

## 📁 Project Structure

```
Scatch/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── .gitignore            # Git ignore rules
├── config/               # Configuration files
│   ├── database.js       # Database connection
│   ├── development.json  # Development settings
│   ├── keys.js          # API keys and secrets
│   ├── multer-config.js # File upload configuration
│   └── redis.js         # Redis configuration
├── controllers/          # Route controllers
│   ├── authController.js
│   ├── userController.js
│   ├── orderController.js
│   └── addressController.js
├── middlewares/          # Custom middleware
│   ├── auth.js          # Authentication middleware
│   ├── isLoggedIn.js    # Login verification
│   ├── rateLimiter.js   # Rate limiting
│   └── validator.js     # Input validation
├── models/              # Database models
│   ├── User.js         # User model
│   ├── Product.js      # Product model
│   ├── Order.js        # Order model
│   ├── Address.js      # Address model
│   └── ...             # Other models
├── routes/              # API routes
│   ├── auth.js         # Authentication routes
│   ├── users.js        # User management routes
│   ├── products.js     # Product routes
│   ├── orders.js       # Order routes
│   └── ...             # Other route files
├── public/              # Static files
│   ├── images/         # Product images
│   ├── stylesheets/    # CSS files
│   ├── javascripts/    # Client-side JS
│   └── uploads/        # User uploads
├── views/              # EJS templates
│   ├── partials/       # Reusable components
│   ├── auth/           # Authentication pages
│   ├── emails/         # Email templates
│   └── ...             # Other view files
└── utils/              # Utility functions
    ├── email.js        # Email utilities
    ├── errorHandler.js # Error handling
    ├── generateToken.js # Token generation
    └── seedProducts.js # Database seeding
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (optional, for caching)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Scatch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/scatch
   SESSION_SECRET=your-session-secret
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   
   # Payment Configuration
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   
   # SMS Configuration (Optional)
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   
   # Redis Configuration (Optional)
   REDIS_URL=redis://localhost:6379
   
   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Seed the database with sample data (optional)
   npm run seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

6. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Product Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)

### Order Endpoints
- `GET /orders` - Get user orders
- `POST /orders` - Create new order
- `GET /orders/:id` - Get order details
- `PUT /orders/:id/status` - Update order status (Admin)

### User Endpoints
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `GET /users/addresses` - Get user addresses
- `POST /users/addresses` - Add new address

## 🔧 Configuration

### Database Configuration
The application uses MongoDB as the primary database. Configure the connection in `config/database.js`.

### Redis Configuration (Optional)
Redis is used for caching and session storage. Configure in `config/redis.js`.

### File Upload Configuration
Multer is configured for handling file uploads. Settings are in `config/multer-config.js`.

## 🛡️ Security Features

- **Authentication**: JWT tokens and session-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive input sanitization
- **Rate Limiting**: Protection against brute force attacks
- **XSS Protection**: Cross-site scripting prevention
- **CSRF Protection**: Cross-site request forgery protection
- **Secure Headers**: Helmet.js for security headers
- **Password Security**: Bcrypt hashing with salt

## 📧 Email Templates

The application includes email templates for:
- Order confirmation
- Order status updates
- Order cancellation
- Password reset
- Email verification

## 🎨 Customization

### Styling
- Modify CSS files in `public/stylesheets/`
- Update EJS templates in `views/`
- Customize Bootstrap theme

### Functionality
- Add new routes in `routes/` directory
- Create new controllers in `controllers/` directory
- Extend models in `models/` directory

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Database
- Use MongoDB Atlas for cloud database
- Set up proper indexes for performance
- Configure backup strategies

### File Storage
- Use cloud storage (AWS S3, Google Cloud Storage) for production
- Configure CDN for static assets

### SSL/TLS
- Enable HTTPS in production
- Configure SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔄 Version History

- **v1.0.0** - Initial release with core e-commerce features

---

**Scatch** - Building the future of e-commerce, one feature at a time! 🛒✨
