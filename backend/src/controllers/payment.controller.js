import { stripe } from "../lib/stripe.js";
import { snap } from "../config/midtrans.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ENV } from "../config/env.js";
import { User } from "../models/user.model.js";
import { Cart } from "../models/cart.model.js";

export async function createPaymentIntent(req, res) {
  try {
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Calculate total from server-side (don't trust client - ever.)
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
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0],
      });
    }

    const shipping = 15000; // Rp 15.000
    const tax = subtotal * 0.08; // 8%
    const total = subtotal + shipping + tax;

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    // find or create the stripe customer
    let customer;
    if (user.stripeCustomerId) {
      // find the customer
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      // create the customer
      customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          clerkId: user.clerkId,
          userId: user._id.toString(),
        },
      });

      // add the stripe customer ID to the  user object in the DB
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customer.id });
    }

    // create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // convert to cents
      currency: "idr",
      customer: customer.id,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        clerkId: user.clerkId,
        userId: user._id.toString(),
        orderItems: JSON.stringify(
          validatedItems.map((p) => ({
            id: p.product,
            price: p.price,
            quantity: p.quantity,
          }))
        ),
        shippingAddress: JSON.stringify(shippingAddress),
        totalPrice: total.toFixed(2),
      },
      // in the webhooks section we will use this metadata
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
}

export async function handleWebhook(req, res) {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, ENV.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    console.log("Payment succeeded:", paymentIntent.id);

    try {
      const { userId, clerkId, orderItems, shippingAddress, totalPrice } = paymentIntent.metadata;

      // Check if order already exists (prevent duplicates)
      const existingOrder = await Order.findOne({ "paymentResult.id": paymentIntent.id });
      if (existingOrder) {
        console.log("Order already exists for payment:", paymentIntent.id);
        return res.json({ received: true });
      }

      // create order
      const order = await Order.create({
        user: userId,
        clerkId,
        orderItems: JSON.parse(orderItems),
        shippingAddress: JSON.parse(shippingAddress),
        paymentResult: {
          id: paymentIntent.id,
          status: "succeeded",
        },
        totalPrice: parseFloat(totalPrice),
      });

      // update product stock
      const items = JSON.parse(orderItems);
      for (const item of items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        });
      }

      console.log("Order created successfully:", order._id);
    } catch (error) {
      console.error("Error creating order from webhook:", error);
    }
  }

  res.json({ received: true });
}

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
