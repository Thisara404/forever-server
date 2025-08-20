const { body } = require("express-validator");

// User registration validation
const validateUserRegistration = [
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters")
    .trim(),

  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .toLowerCase(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
];

// User login validation
const validateUserLogin = [
  body("email")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail()
    .toLowerCase(),

  body("password").notEmpty().withMessage("Password is required"),
];

// Product validation
const validateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Product name must be between 2 and 100 characters")
    .trim(),

  body("description")
    .notEmpty()
    .withMessage("Product description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters")
    .trim(),

  body("price")
    .isNumeric()
    .withMessage("Price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Price must be positive"),

  body("category")
    .isIn(["Men", "Women", "Kids"])
    .withMessage("Category must be Men, Women, or Kids"),

  body("subCategory")
    .isIn(["Topwear", "Bottomwear", "Winterwear"])
    .withMessage("Sub-category must be Topwear, Bottomwear, or Winterwear"),

  body("sizes")
    .isArray({ min: 1 })
    .withMessage("At least one size must be provided"),

  body("sizes.*")
    .isIn(["S", "M", "L", "XL", "XXL"])
    .withMessage("Size must be S, M, L, XL, or XXL"),
];

// Order validation
const validateOrder = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Order must contain at least one item"),

  body("items.*.productId")
    .isMongoId()
    .withMessage("Valid product ID is required"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("items.*.size").notEmpty().withMessage("Size is required"),

  body("shippingAddress.firstName")
    .notEmpty()
    .withMessage("First name is required")
    .trim(),

  body("shippingAddress.lastName")
    .notEmpty()
    .withMessage("Last name is required")
    .trim(),

  body("shippingAddress.email")
    .isEmail()
    .withMessage("Valid email is required"),

  body("shippingAddress.street")
    .notEmpty()
    .withMessage("Street address is required")
    .trim(),

  body("shippingAddress.city")
    .notEmpty()
    .withMessage("City is required")
    .trim(),

  body("shippingAddress.state")
    .notEmpty()
    .withMessage("State is required")
    .trim(),

  body("shippingAddress.zipcode")
    .notEmpty()
    .withMessage("Zipcode is required")
    .trim(),

  body("shippingAddress.country")
    .notEmpty()
    .withMessage("Country is required")
    .trim(),

  body("shippingAddress.phone")
    .isMobilePhone()
    .withMessage("Valid phone number is required"),

  body("paymentMethod")
    .isIn(["stripe", "payhere", "cod"]) // Updated to include PayHere
    .withMessage("Payment method must be stripe, payhere, or cod"),
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateProduct,
  validateOrder,
};
