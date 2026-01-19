import midtransClient from "midtrans-client";
import { ENV } from "./env.js";

// Create Snap API instance
export const snap = new midtransClient.Snap({
    isProduction: ENV.MIDTRANS_IS_PRODUCTION || false,
    serverKey: ENV.MIDTRANS_SERVER_KEY,
    clientKey: ENV.MIDTRANS_CLIENT_KEY,
});

// Create Core API instance (optional, for handling notifications/status checks)
export const coreApi = new midtransClient.CoreApi({
    isProduction: ENV.MIDTRANS_IS_PRODUCTION || false,
    serverKey: ENV.MIDTRANS_SERVER_KEY,
    clientKey: ENV.MIDTRANS_CLIENT_KEY,
});
