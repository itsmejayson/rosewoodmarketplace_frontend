import { create } from 'zustand';
import { cartAPI } from '../api';

const useCartStore = create((set, get) => ({
  cart: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const { data } = await cartAPI.get();
      set({ cart: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1, selectedOptions = null) => {
    const { data } = await cartAPI.addItem({ productId, quantity, ...(selectedOptions ? { selectedOptions } : {}) });
    await get().fetchCart();
    return data;
  },

  updateItem: async (productId, quantity, itemId) => {
    await cartAPI.updateItem(productId, { quantity, itemId });
    await get().fetchCart();
  },

  removeItem: async (productId, itemId) => {
    await cartAPI.removeItem(productId, itemId);
    await get().fetchCart();
  },

  clearCart: async () => {
    await cartAPI.clear();
    set({ cart: null });
  },

  get itemCount() {
    return get().cart?.itemCount ?? 0;
  },
}));

export default useCartStore;
