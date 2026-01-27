import { orderApi, treasuryApi } from "../lib/api";
import { formatDate } from "../lib/utils";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { useToast } from "../components/Toast";
import { useConfirm } from "../components/ConfirmModal";

function OrdersPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const toast = useToast();
  const confirm = useConfirm();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: orderApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast.success("Status order berhasil diupdate!");
    },
  });

  const manualVerifyMutation = useMutation({
    mutationFn: orderApi.manualVerify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-treasury"] });
      toast.success('Payment verified! Treasury updated.');
    },
    onError: (error) => {
      toast.error('Failed to verify: ' + (error.response?.data?.error || error.message));
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: orderApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success('Order deleted successfully!');
    },
    onError: (error) => {
      toast.error('Failed to delete order: ' + error.message);
    },
  });

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'canceled') {
      const confirmed = await confirm({
        title: 'Batalkan Order?',
        message: 'Order akan dibatalkan dan tidak dapat dikembalikan.',
        type: 'danger',
        confirmText: 'Ya, Batalkan',
        cancelText: 'Tidak',
      });
      if (!confirmed) return;
    }
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleManualVerify = async (orderId) => {
    const confirmed = await confirm({
      title: 'Verifikasi Manual',
      message: 'Verifikasi pembayaran order ini secara manual?',
      type: 'warning',
      confirmText: 'Ya, Verifikasi',
      cancelText: 'Batal',
      details: [
        'Stok produk akan dikurangi',
        'Uang masuk ke Treasury',
        'Payout record dibuat untuk seller'
      ]
    });
    if (confirmed) {
      manualVerifyMutation.mutate(orderId);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    const confirmed = await confirm({
      title: 'Hapus Order?',
      message: 'Order yang belum dibayar ini akan dihapus permanen.',
      type: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
    });
    if (confirmed) {
      deleteOrderMutation.mutate(orderId);
    }
  };

  const orders = ordersData?.orders || [];

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    if (filter === "awaiting") return order.status === "awaiting_payment";
    if (filter === "paid") return order.isPaid && order.status !== "delivered";
    if (filter === "delivered") return order.status === "delivered";
    return true;
  });

  const awaitingCount = orders.filter(o => o.status === "awaiting_payment").length;
  const paidPendingCount = orders.filter(o => o.isPaid && o.status === "pending").length;
  const deliveredCount = orders.filter(o => o.status === "delivered").length;

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-base-content/70">Manage customer orders</p>
      </div>

      {/* Info Banner - Updated for auto-payment */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🚀</span>
          <div className="text-sm">
            <p className="font-semibold text-green-900">Pembayaran Otomatis Aktif!</p>
            <p className="text-green-700 mt-1">
              Setelah customer bayar via Midtrans, order <strong>otomatis jadi Paid</strong>.
              Tidak perlu verifikasi manual lagi. Status akan update secara real-time.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Stok berkurang otomatis
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Treasury ter-update
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Payout record dibuat
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter("all")}
          className={`stat bg-base-100 rounded-xl shadow cursor-pointer hover:bg-base-200 transition ${filter === "all" ? "ring-2 ring-primary" : ""}`}
        >
          <div className="stat-title">Total Orders</div>
          <div className="stat-value text-primary">{orders.length}</div>
        </button>
        <button
          onClick={() => setFilter("awaiting")}
          className={`stat bg-base-100 rounded-xl shadow cursor-pointer hover:bg-base-200 transition ${filter === "awaiting" ? "ring-2 ring-warning" : ""}`}
        >
          <div className="stat-title">⏳ Awaiting Payment</div>
          <div className="stat-value text-warning">{awaitingCount}</div>
          <div className="stat-desc">Perlu verifikasi</div>
        </button>
        <button
          onClick={() => setFilter("paid")}
          className={`stat bg-base-100 rounded-xl shadow cursor-pointer hover:bg-base-200 transition ${filter === "paid" ? "ring-2 ring-info" : ""}`}
        >
          <div className="stat-title">📦 Paid & Processing</div>
          <div className="stat-value text-info">{paidPendingCount}</div>
          <div className="stat-desc">Perlu dikirim</div>
        </button>
        <button
          onClick={() => setFilter("delivered")}
          className={`stat bg-base-100 rounded-xl shadow cursor-pointer hover:bg-base-200 transition ${filter === "delivered" ? "ring-2 ring-success" : ""}`}
        >
          <div className="stat-title">✅ Delivered</div>
          <div className="stat-value text-success">{deliveredCount}</div>
        </button>
      </div>

      {/* ORDERS TABLE */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">No orders found</p>
              <p className="text-sm">Try changing the filter above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Breakdown</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map((order) => {
                    const totalQuantity = order.orderItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );
                    const isAwaitingPayment = order.status === "awaiting_payment";

                    return (
                      <tr key={order._id} className={isAwaitingPayment ? "bg-yellow-50" : ""}>
                        <td>
                          <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                          {order.store && (
                            <div className="text-xs text-gray-500">Store Order</div>
                          )}
                        </td>

                        <td>
                          <div className="font-medium">{order.shippingAddress.fullName}</div>
                          <div className="text-sm opacity-60">
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </div>
                        </td>

                        <td>
                          <div className="font-medium">{totalQuantity} items</div>
                          <div className="text-sm opacity-60">
                            {order.orderItems[0]?.name}
                            {order.orderItems.length > 1 && ` +${order.orderItems.length - 1} more`}
                          </div>
                        </td>

                        <td>
                          <div className="text-sm space-y-0.5">
                            <div className="font-semibold">{formatRupiah(order.totalPrice)}</div>
                            {order.sellerEarnings > 0 && (
                              <div className="text-xs text-gray-500">
                                Produk: {formatRupiah(order.sellerEarnings)}
                              </div>
                            )}
                            {order.shippingCost > 0 && (
                              <div className="text-xs text-gray-500">
                                Ongkir: {formatRupiah(order.shippingCost)}
                              </div>
                            )}
                            {order.adminFee > 0 && (
                              <div className="text-xs text-gray-500">
                                Admin: {formatRupiah(order.adminFee)}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          {order.isPaid ? (
                            <div className="flex flex-col gap-1">
                              <span className="badge badge-success gap-1">
                                ✓ Paid
                              </span>
                              <span className="text-xs text-gray-500">
                                {order.paidAt ? formatDate(order.paidAt) : ""}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              <span className="badge badge-warning gap-1">
                                ⏳ Menunggu Bayar
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleManualVerify(order._id)}
                                  className="btn btn-ghost btn-xs text-success hover:bg-success hover:text-white"
                                  disabled={manualVerifyMutation.isPending}
                                  title="Verifikasi manual (jika otomatis gagal)"
                                >
                                  {manualVerifyMutation.isPending ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <>✓</>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(order._id)}
                                  className="btn btn-ghost btn-xs text-error hover:bg-error hover:text-white"
                                  disabled={deleteOrderMutation.isPending}
                                  title="Hapus order"
                                >
                                  {deleteOrderMutation.isPending ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <>✕</>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        <td>
                          {isAwaitingPayment ? (
                            <span className="badge badge-warning badge-lg">
                              ⏳ Awaiting Payment
                            </span>
                          ) : (
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className={`select select-sm ${order.status === 'pending' ? 'select-warning' :
                                order.status === 'shipped' ? 'select-info' :
                                  order.status === 'delivered' ? 'select-success' :
                                    'select-error'
                                }`}
                              disabled={updateStatusMutation.isPending}
                            >
                              <option value="pending">📦 Pending</option>
                              <option value="shipped">🚚 Shipped</option>
                              <option value="delivered">✅ Delivered</option>
                              <option value="canceled">❌ Canceled</option>
                            </select>
                          )}
                        </td>

                        <td>
                          <span className="text-sm opacity-60">{formatDate(order.createdAt)}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default OrdersPage;
