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
    // Note: This endpoint is in payment route, not admin route
    // But axiosInstance base URL handles /api context?
    // axios default baseURL is usually VITE_API_URL/api
    // So if route is /api/payment/manual-verify/:orderId
    // We should call /payment/manual-verify/:orderId
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
