import { snap } from "../config/midtrans.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { calculateCartShipping } from "../services/shipping.service.js";
import { v4 as uuidv4 } from "uuid";

export async function createSnapTransaction(req, res) {
  try {
    const { cartItems, shippingAddress } = req.body;
    const user = req.user;

    // Validate cart items
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Check if address has coordinates for shipping calculation
    if (!shippingAddress.coordinates?.latitude || !shippingAddress.coordinates?.longitude) {
      return res.status(400).json({
        error: "Please update your delivery address with location coordinates for shipping calculation",
      });
    }

    // Calculate total from server-side and group items by store
    let subtotal = 0;
    const validatedItems = [];
    const itemsByStore = new Map(); // storeId -> items[]

    for (const item of cartItems) {
      const product = await Product.findById(item.product._id).populate("store");
      if (!product) {
        return res.status(404).json({ error: `Product ${item.product.name} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      subtotal += product.price * item.quantity;

      const validatedItem = {
        id: product._id.toString(),
        price: product.price,
        quantity: item.quantity,
        name: product.name.substring(0, 50), // Midtrans name limit
        product: product, // Include full product for shipping calculation
        storeId: product.store?._id?.toString() || null, // null = admin product
        image: product.images?.[0] || "",
      };

      validatedItems.push(validatedItem);

      // Group by store
      const storeKey = validatedItem.storeId || "admin";
      if (!itemsByStore.has(storeKey)) {
        itemsByStore.set(storeKey, []);
      }
      itemsByStore.get(storeKey).push(validatedItem);
    }

    // Calculate dynamic shipping based on distance
    let shippingCalculation;
    try {
      shippingCalculation = calculateCartShipping(validatedItems, shippingAddress.coordinates);
    } catch (error) {
      console.error("Shipping calculation error:", error);
      return res.status(400).json({
        error: error.message || "Failed to calculate shipping cost",
      });
    }

    const shipping = shippingCalculation.total;
    const admin = 1500; // 1500 - for admin fee
    const total = subtotal + shipping + admin;

    if (total <= 0) {
      return res.status(400).json({ error: "Invalid order total" });
    }

    const checkoutId = uuidv4(); // Unique ID to group split orders
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
        ...validatedItems.map(item => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        })),
        {
          id: "SHIPPING",
          price: shipping,
          quantity: 1,
          name: "Shipping Cost",
        },
        {
          id: "admin",
          price: admin,
          quantity: 1,
          name: "admin fee",
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
      enabled_payments: ["credit_card", "gopay", "shopeepay", "permata_va", "bca_va", "bni_va", "bri_va", "echannel", "other_va", "qris"],
    };

    // Create Snap transaction
    const transaction = await snap.createTransaction(transactionDetails);

    // Create SPLIT ORDERS - one per store
    console.log(`Creating ${itemsByStore.size} split order(s) for checkout ${checkoutId}...`);

    const createdOrders = [];
    let orderIndex = 0;

    for (const [storeKey, storeItems] of itemsByStore) {
      const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Proportional shipping per store (based on item value)
      const storeShippingRatio = storeSubtotal / subtotal;
      const storeShipping = Math.round(shipping * storeShippingRatio);

      // Only first order gets admin fee
      const storeAdminFee = orderIndex === 0 ? admin : 0;
      const storeTotalPrice = storeSubtotal + storeShipping + storeAdminFee;

      const orderData = {
        user: user._id,
        clerkId: user.clerkId,
        checkoutId: checkoutId,
        store: storeKey === "admin" ? null : storeKey,
        orderItems: storeItems.map(item => ({
          product: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        shippingAddress,
        paymentResult: {
          id: orderId, // All split orders share the same Midtrans order ID
          status: "pending",
        },
        totalPrice: storeTotalPrice,
        // Price breakdown for accurate payout
        sellerEarnings: storeSubtotal, // Product price only - what seller will receive
        shippingCost: storeShipping,
        adminFee: storeAdminFee,
        status: "awaiting_payment",
        isPaid: false,
        trackingHistory: [
          {
            status: "awaiting_payment",
            title: "Menunggu Pembayaran",
            description: "Pesanan dibuat, menunggu pembayaran",
          },
        ],
      };

      const order = await Order.create(orderData);
      createdOrders.push(order);

      console.log(`✅ Split order created for store ${storeKey}:`, order._id);
      orderIndex++;
    }

    console.log(`⚠️  Stock NOT reduced yet - waiting for payment verification`);

    res.status(200).json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      midtransOrderId: orderId, // Midtrans payment ID for check-status
      orderId: createdOrders[0]._id, // Return first order ID for backward compatibility
      orderIds: createdOrders.map(o => o._id), // All order IDs
      checkoutId: checkoutId, // For tracking the entire checkout
      shippingBreakdown: shippingCalculation.breakdown,
    });

  } catch (error) {
    console.error("Error creating Midtrans transaction:", error);
    if (error.name === 'ValidationError') {
      console.error("Validation Details:", JSON.stringify(error.errors, null, 2));
    }
    res.status(500).json({
      error: "Failed to create payment transaction",
      details: error.message
    });
  }
}

