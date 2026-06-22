import { create } from 'zustand';
import api from '../api/axios';
import { applyBrandColor } from '../utils/colorUtils';

const DEFAULT_COLOR = '#C84B6E';

const useAppConfigStore = create((set) => ({
  appName: 'Rosewood',
  appTagline: 'Fresh food & quality materials',
  brandColor: DEFAULT_COLOR,
  logoUrl: null,
  loaded: false,

  fetch: async () => {
    try {
      const { data } = await api.get('/settings');
      const cfg = data.data;
      const brandColor = cfg.brandColor || DEFAULT_COLOR;
      applyBrandColor(brandColor);
      set({
        appName: cfg.appName || 'Rosewood',
        appTagline: cfg.appTagline || 'Fresh food & quality materials',
        brandColor,
        logoUrl: cfg.logoUrl || null,
        loaded: true,
      });
    } catch {
      applyBrandColor(DEFAULT_COLOR);
      set({ loaded: true });
    }
  },

  update: (patch) => {
    if (patch.brandColor) applyBrandColor(patch.brandColor);
    set((s) => ({ ...s, ...patch }));
  },
}));

export default useAppConfigStore;
