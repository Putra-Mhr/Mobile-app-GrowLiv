import { snap } from "../config/midtrans.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Store } from "../models/store.model.js";
import { calculateCartShipping } from "../services/shipping.service.js";
import { v4 as uuidv4 } from "uuid";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const createSnapTransaction = asyncHandler(async (req, res) => {
  const { cartItems, shippingAddress } = req.body;
  const user = req.user;

  // Validate cart items
  if (!cartItems || cartItems.length === 0) {
    throw new AppError("Cart is empty", 400);
  }

  // Check if address has coordinates for shipping calculation
  if (!shippingAddress.coordinates?.latitude || !shippingAddress.coordinates?.longitude) {
    throw new AppError(
      "Please update your delivery address with location coordinates for shipping calculation",
      400
    );
  }

  // Calculate total from server-side and group items by store
  let subtotal = 0;
  const validatedItems = [];
  const itemsByStore = new Map();

  for (const item of cartItems) {
    const product = await Product.findById(item.product._id).populate("store");
    if (!product) {
      throw new AppError(`Product ${item.product.name} not found`, 404);
    }

    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}`, 400);
    }

    subtotal += product.price * item.quantity;

    const validatedItem = {
      id: product._id.toString(),
      price: product.price,
      quantity: item.quantity,
      name: product.name.substring(0, 50),
      product: product,
      storeId: product.store?._id?.toString() || null,
      image: product.images?.[0] || "",
    };

    validatedItems.push(validatedItem);

    const storeKey = validatedItem.storeId || "admin";
    if (!itemsByStore.has(storeKey)) {
      itemsByStore.set(storeKey, []);
    }
    itemsByStore.get(storeKey).push(validatedItem);
  }

  // Calculate dynamic shipping based on distance
  // Inner try-catch: shipping calc errors should be 400, not 500
  let shippingCalculation;
  try {
    shippingCalculation = calculateCartShipping(validatedItems, shippingAddress.coordinates);
  } catch (shippingError) {
    throw new AppError(shippingError.message || "Failed to calculate shipping cost", 400);
  }

  const shipping = shippingCalculation.total;
  const admin = 1500;
  const total = subtotal + shipping + admin;

  if (total <= 0) {
    throw new AppError("Invalid order total", 400);
  }

  const checkoutId = uuidv4();
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

    const storeShippingRatio = storeSubtotal / subtotal;
    const storeShipping = Math.round(shipping * storeShippingRatio);

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
        id: orderId,
        status: "pending",
      },
      totalPrice: storeTotalPrice,
      sellerEarnings: storeSubtotal,
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
    midtransOrderId: orderId,
    orderId: createdOrders[0]._id,
    orderIds: createdOrders.map(o => o._id),
    checkoutId: checkoutId,
    shippingBreakdown: shippingCalculation.breakdown,
    shippingWarnings: shippingCalculation.warnings,
  });
});
