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

  addItem: async (productId, quantity = 1) => {
    const { data } = await cartAPI.addItem({ productId, quantity });
    await get().fetchCart();
    return data;
  },

  updateItem: async (productId, quantity) => {
    await cartAPI.updateItem(productId, { quantity });
    await get().fetchCart();
  },

  removeItem: async (productId) => {
    await cartAPI.removeItem(productId);
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
