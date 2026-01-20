import { snap } from "../config/midtrans.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";

export async function createSnapTransaction(req, res) {
  try {
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total from server-side
    let subtotal = 0;
    const validatedItems = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id);
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;
      validatedItems.push({
        id: product._id.toString(),
        price: product.price,
        quantity: item.quantity,
        name: product.name.substring(0, 50), // Midtrans name limit
      });
    }

    const shipping = 15000; // Rp 15.000
    const tax = Math.round(subtotal * 0.08); // 8% - rounding is important for Midtrans
    const total = subtotal + shipping + tax;

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare transaction details for Midtrans
    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: total,
      },
      credit_card: {
        secure: true,
      },
      item_details: [
        ...validatedItems,
        {
          id: "SHIPPING",
          price: shipping,
          quantity: 1,
          name: "Shipping Cost",
        },
        {
          id: "TAX",
          price: tax,
          quantity: 1,
          name: "Tax (8%)",
        },
      ],
      customer_details: {
        first_name: user.name,
        email: user.email,
        phone: shippingAddress.phoneNumber,
        shipping_address: {
          first_name: shippingAddress.fullName,
          email: user.email,
          phone: shippingAddress.phoneNumber,
          address: shippingAddress.streetAddress,
          city: shippingAddress.city,
          postal_code: shippingAddress.zipCode,
          country_code: "IDN",
        },
      },
      enabled_payments: ["credit_card", "gopay", "shopeepay", "permata_va", "bca_va", "bni_va", "bri_va", "echannel", "other_va", "qris"], // Enable specific methods
    };

    // Create Snap transaction
    const transaction = await snap.createTransaction(transactionDetails);

    // Ideally, we should create a "pending" order here so we can track it even if the user drops off
    // For now, mirroring the Stripe logic which creates order on webhook.
    // However, Midtrans recommends creating order first or handling notification strictly.
    // We will pass necessary metadata via custom field if possible, or just rely on order_id.
    // Midtrans doesn't allow arbitrary large metadata.
    // So we will rely on creating the order AFTER success, or create PENDING order now.
    // Let's create a PENDING order now to link with the orderId.

    const order = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      orderItems: cartItems.map((item, index) => ({
        product: item.product._id,
        name: validatedItems[index].name,
        price: validatedItems[index].price,
        quantity: item.quantity,
        image: item.product.images ? item.product.images[0] : "",
      })),
      shippingAddress,
      paymentResult: {
        id: orderId, // Use our generated Order ID initially
        status: "pending",
      },
      totalPrice: total,
      status: "pending",
    });

    res.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    res.status(500).json({ error: "Failed to create payment transaction" });
  }
}
