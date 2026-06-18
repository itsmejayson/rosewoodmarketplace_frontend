import { create } from 'zustand';
import { orderAPI } from '../api';

const useSellerOrderStore = create((set) => ({
  pendingCount: 0,

  fetchPendingCount: async () => {
    try {
      const { data } = await orderAPI.sellerOrders({ page: 1, limit: 100 });
      const orders = data.data || [];
      const count = orders.filter((o) => {
        const tx = o.transaction;
        return (
          (tx?.paymentMethod === 'GCASH' && tx?.paymentStatus === 'PENDING_VERIFICATION') ||
          (tx?.paymentMethod === 'CASH' && tx?.paymentStatus === 'PENDING')
        );
      }).length;
      set({ pendingCount: count });
    } catch {
      // silently fail
    }
  },
}));

export default useSellerOrderStore;
