import { orderApi } from "../lib/api";
import { formatDate } from "../lib/utils";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function OrdersPage() {
  const queryClient = useQueryClient();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: orderApi.getAll,
  });

  const updateStatusMutation = useMutation({
    mutationFn: orderApi.updateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
  });

  const manualVerifyMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payment/manual-verify/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clerk-token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to verify payment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      alert('✅ Payment verified successfully!');
    },
    onError: (error) => {
      alert('❌ Failed to verify: ' + error.message);
    },
  });

  const handleStatusChange = (orderId, newStatus) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleManualVerify = (orderId) => {
    if (confirm('Manually mark this order as PAID? This will reduce stock and clear cart.')) {
      manualVerifyMutation.mutate(orderId);
    }
  };

  const orders = ordersData?.orders || [];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-base-content/70">Manage customer orders</p>
      </div>

      {/* ORDERS TABLE */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <p className="text-xl font-semibold mb-2">No orders yet</p>
              <p className="text-sm">Orders will appear here once customers make purchases</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const totalQuantity = order.orderItems.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );

                    return (
                      <tr key={order._id}>
                        <td>
                          <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
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
                          <span className="font-semibold">
                            Rp {order.totalPrice.toLocaleString("id-ID")}
                          </span>
                        </td>

                        <td>
                          <div className="flex flex-col gap-1">
                            {/* Order Status */}
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

                            {/* Payment Status Badge */}
                            {order.isPaid ? (
                              <span className="badge badge-success badge-sm gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Paid
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <span className="badge badge-warning badge-sm gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  Unpaid
                                </span>
                                {/* TEMPORARY: Manual verify button for testing */}
                                <button
                                  onClick={() => handleManualVerify(order._id)}
                                  className="btn btn-xs btn-success gap-1"
                                  disabled={manualVerifyMutation.isPending}
                                >
                                  {manualVerifyMutation.isPending ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    <>✓ Verify</>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
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
