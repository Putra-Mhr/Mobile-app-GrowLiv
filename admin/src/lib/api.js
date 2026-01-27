import axiosInstance from "./axios";

export const productApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/products");
    return data;
  },

  create: async (formData) => {
    const { data } = await axiosInstance.post("/admin/products", formData);
    return data;
  },

  update: async ({ id, formData }) => {
    const { data } = await axiosInstance.put(`/admin/products/${id}`, formData);
    return data;
  },

  delete: async (productId) => {
    const { data } = await axiosInstance.delete(`/admin/products/${productId}`);
    return data;
  },
};

export const orderApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/orders");
    return data;
  },

  updateStatus: async ({ orderId, status }) => {
    const { data } = await axiosInstance.patch(`/admin/orders/${orderId}/status`, { status });
    return data;
  },

  manualVerify: async (orderId) => {
    const { data } = await axiosInstance.post(`/payment/manual-verify/${orderId}`);
    return data;
  },

  delete: async (orderId) => {
    const { data } = await axiosInstance.delete(`/admin/orders/${orderId}`);
    return data;
  },
};

export const statsApi = {
  getDashboard: async () => {
    const { data } = await axiosInstance.get("/admin/stats");
    return data;
  },
};

export const customerApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/customers");
    return data;
  },
};

export const storeApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get("/admin/stores");
    return data;
  },

  verify: async ({ storeId, isVerified }) => {
    const { data } = await axiosInstance.patch(`/admin/stores/${storeId}/verify`, { isVerified });
    return data;
  },

  processPayout: async ({ storeId, amount, notes }) => {
    const { data } = await axiosInstance.post(`/admin/payouts/${storeId}`, { amount, notes });
    return data;
  },
};

export const treasuryApi = {
  // Get treasury status
  get: async () => {
    const { data } = await axiosInstance.get("/admin/treasury");
    return data;
  },

  // Get extended dashboard with treasury info
  getDashboardExtended: async () => {
    const { data } = await axiosInstance.get("/admin/stats/extended");
    return data;
  },

  // Get pending payouts (grouped by store)
  getPendingPayouts: async () => {
    const { data } = await axiosInstance.get("/admin/payouts/pending");
    return data;
  },

  // Get payout history
  getPayoutHistory: async (params = {}) => {
    const { data } = await axiosInstance.get("/admin/payouts/history", { params });
    return data;
  },

  // Process payout to store
  processPayout: async ({ storeId, amount, notes }) => {
    const { data } = await axiosInstance.post(`/admin/payouts/${storeId}`, { amount, notes });
    return data;
  },
};
