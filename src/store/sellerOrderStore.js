import { create } from 'zustand';
import { orderAPI, refundAPI } from '../api';

const useSellerOrderStore = create((set) => ({
  pendingCount: 0,
  pendingRefundCount: 0,

  fetchPendingCount: async () => {
    try {
      const [ordersRes, refundsRes] = await Promise.all([
        orderAPI.sellerOrders({ page: 1, limit: 100 }),
        refundAPI.seller(),
      ]);
      const orders = ordersRes.data.data || [];
      const count = orders.filter((o) => {
        const tx = o.transaction;
        return (
          (tx?.paymentMethod === 'GCASH' && tx?.paymentStatus === 'PENDING_VERIFICATION') ||
          (tx?.paymentMethod === 'CASH' && tx?.paymentStatus === 'PENDING')
        );
      }).length;
      const refunds = refundsRes.data.data || [];
      const pendingRefundCount = refunds.filter((r) => r.status === 'PENDING').length;
      set({ pendingCount: count, pendingRefundCount });
    } catch {
      // silently fail
    }
  },
}));

export default useSellerOrderStore;
