/**
 * Tests for components/layout/BottomNav.jsx
 *
 * Covers:
 *  - Guest user sees Shop / Stores / Login tabs
 *  - BUYER sees Home / Stores / Cart / Orders / Me tabs
 *  - SELLER sees Dashboard / Shop / Orders / Products / Me tabs
 *  - ADMIN sees Dashboard / Shop / Users / Stores / Settings / Me tabs
 *  - Cart badge shows item count for BUYER
 *  - Pending-orders badge shows count for SELLER
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BottomNav from '../components/layout/BottomNav';

// Mock Zustand stores so the component gets controlled state
vi.mock('../store/authStore', () => ({
  default: vi.fn(),
}));
vi.mock('../store/cartStore', () => ({
  default: vi.fn(),
}));
vi.mock('../store/sellerOrderStore', () => ({
  default: vi.fn(),
}));

import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import useSellerOrderStore from '../store/sellerOrderStore';

function setup({ user = null, cart = null, pendingCount = 0 } = {}) {
  useAuthStore.mockReturnValue({ user });
  useCartStore.mockReturnValue({ cart });
  useSellerOrderStore.mockReturnValue({ pendingCount });

  return render(
    <MemoryRouter initialEntries={['/']}>
      <BottomNav />
    </MemoryRouter>
  );
}

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Guest ─────────────────────────────────────────────────────────────────────

  describe('Guest (no user)', () => {
    it('shows Shop, Stores, and Login tabs', () => {
      setup({ user: null });
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Stores')).toBeInTheDocument();
      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('does NOT show buyer-only tabs', () => {
      setup({ user: null });
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
      expect(screen.queryByText('Orders')).not.toBeInTheDocument();
    });
  });

  // ── BUYER ──────────────────────────────────────────────────────────────────────

  describe('BUYER role', () => {
    const buyer = { id: 'usr-001', role: 'BUYER' };

    it('shows Home, Stores, Cart, Orders, Me tabs', () => {
      setup({ user: buyer });
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Stores')).toBeInTheDocument();
      expect(screen.getByText('Cart')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('shows cart item count badge when itemCount > 0', () => {
      setup({ user: buyer, cart: { itemCount: 3 } });
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('does NOT show cart badge when cart is empty', () => {
      setup({ user: buyer, cart: { itemCount: 0 } });
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('shows 9+ badge when itemCount exceeds 9', () => {
      setup({ user: buyer, cart: { itemCount: 15 } });
      expect(screen.getByText('9+')).toBeInTheDocument();
    });
  });

  // ── SELLER ─────────────────────────────────────────────────────────────────────

  describe('SELLER role', () => {
    const seller = { id: 'usr-seller-001', role: 'SELLER' };

    it('shows Dashboard, Shop, Orders, Products, Me tabs', () => {
      setup({ user: seller });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('shows pending-orders badge when pendingCount > 0', () => {
      setup({ user: seller, pendingCount: 4 });
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('does NOT show buyer Cart tab', () => {
      setup({ user: seller });
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
    });
  });

  // ── ADMIN ──────────────────────────────────────────────────────────────────────

  describe('ADMIN role', () => {
    const admin = { id: 'usr-admin-001', role: 'ADMIN' };

    it('shows Dashboard, Shop, Users, Stores, Settings, Me tabs', () => {
      setup({ user: admin });
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Shop')).toBeInTheDocument();
      expect(screen.getByText('Users')).toBeInTheDocument();
      expect(screen.getByText('Stores')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Me')).toBeInTheDocument();
    });

    it('does NOT show buyer or seller-only tabs', () => {
      setup({ user: admin });
      expect(screen.queryByText('Cart')).not.toBeInTheDocument();
      expect(screen.queryByText('Products')).not.toBeInTheDocument();
    });
  });
});
