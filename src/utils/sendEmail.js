const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (userEmail, orderData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: userEmail,
      subject: `Order Confirmation - ${orderData._id}`,
      html: generateOrderConfirmationHTML(orderData)
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send order confirmation email');
  }
};

// Send order status update email
const sendOrderStatusUpdateEmail = async (userEmail, orderData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: userEmail,
      subject: `Order ${orderData.orderStatus} - ${orderData._id}`,
      html: generateOrderStatusUpdateHTML(orderData)
    };

    await transporter.sendMail(mailOptions);
    console.log('Order status update email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send order status update email');
  }
};

// Generate order confirmation HTML
const generateOrderConfirmationHTML = (order) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .order-summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 15px; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Forever E-Commerce</h1>
                <h2>Order Confirmation</h2>
            </div>
            
            <div class="content">
                <p>Thank you for your order! Your order has been confirmed and will be processed soon.</p>
                
                <div class="order-summary">
                    <h3>Order Details</h3>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                    <p><strong>Status:</strong> ${order.orderStatus}</p>
                </div>
                
                <div class="order-summary">
                    <h3>Items Ordered</h3>
                    ${order.items.map(item => `
                        <div class="item">
                            <p><strong>${item.name}</strong></p>
                            <p>Size: ${item.size} | Quantity: ${item.quantity} | Price: LKR ${item.price}</p>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-summary">
                    <h3>Shipping Address</h3>
                    <p>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</p>
                    <p>${order.shippingAddress.street}</p>
                    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipcode}</p>
                    <p>${order.shippingAddress.country}</p>
                    <p>Phone: ${order.shippingAddress.phone}</p>
                </div>
                
                <div class="order-summary">
                    <h3>Order Summary</h3>
                    <p>Subtotal: LKR ${order.subtotal}</p>
                    <p>Shipping: LKR ${order.shippingFee}</p>
                    <p class="total">Total: LKR ${order.totalAmount}</p>
                </div>
                
                <p>We'll send you another email when your order ships.</p>
            </div>
            
            <div class="footer">
                <p>Thank you for shopping with Forever E-Commerce!</p>
                <p>If you have any questions, please contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Generate order status update HTML
const generateOrderStatusUpdateHTML = (order) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Order Status Update</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #000; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .status-update { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .footer { background-color: #f8f9fa; padding: 15px; text-align: center; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Forever E-Commerce</h1>
                <h2>Order Status Update</h2>
            </div>
            
            <div class="content">
                <div class="status-update">
                    <h3>Your order status has been updated!</h3>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>New Status:</strong> ${order.orderStatus.toUpperCase()}</p>
                    <p><strong>Updated At:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                
                <p>Thank you for your patience. We'll continue to keep you updated on your order progress.</p>
            </div>
            
            <div class="footer">
                <p>Thank you for shopping with Forever E-Commerce!</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

module.exports = {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};