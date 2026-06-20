/**
 * Tests for pages/admin/AdminSettingsPage.jsx
 *
 * Covers:
 *  - Loading state is shown before settings arrive
 *  - Toggle button renders with correct state (enabled/disabled) after load
 *  - Clicking the toggle calls adminAPI.updateSettings with the opposite value
 *  - Success toast is shown after a successful toggle
 *  - Error toast is shown when updateSettings rejects
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// ── API mock ──────────────────────────────────────────────────────────────────
vi.mock('../api', () => ({
  adminAPI: {
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

// ── Toast mock — capture calls so we can assert on them ──────────────────────
const mockToast = vi.fn();
vi.mock('../components/ui/toast', () => ({
  toast: (...args) => mockToast(...args),
}));

import { adminAPI } from '../api';

const ENABLED_SETTINGS  = { aiAssistantEnabled: true };
const DISABLED_SETTINGS = { aiAssistantEnabled: false };

function setup() {
  return render(<AdminSettingsPage />);
}

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ─────────────────────────────────────────────────────────────

  it('shows a loading spinner before settings are fetched', async () => {
    // Never-resolving promise to keep the component in loading state
    adminAPI.getSettings.mockReturnValueOnce(new Promise(() => {}));
    setup();
    // The Loader2 spinner is rendered inside a flex container when settings === null
    // We verify via the DOM structure: the spinner wraps the icon so aria or role won't help —
    // check that the toggle button is NOT yet present
    expect(screen.queryByRole('button', { name: /disable|enable/i })).not.toBeInTheDocument();
  });

  // ── Renders toggle ────────────────────────────────────────────────────────────

  it('renders AI Assistant toggle as enabled when settings.aiAssistantEnabled is true', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: ENABLED_SETTINGS } });
    setup();
    const toggle = await screen.findByRole('button', { name: /disable/i });
    expect(toggle).toBeInTheDocument();
  });

  it('renders AI Assistant toggle as disabled when settings.aiAssistantEnabled is false', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: DISABLED_SETTINGS } });
    setup();
    const toggle = await screen.findByRole('button', { name: /enable/i });
    expect(toggle).toBeInTheDocument();
  });

  it('displays the page heading and description text', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: ENABLED_SETTINGS } });
    setup();
    expect(await screen.findByText(/System Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Market Assistant \(AI Chat\)/i)).toBeInTheDocument();
  });

  // ── Toggle interaction ────────────────────────────────────────────────────────

  it('calls updateSettings with the toggled value when toggle is clicked', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: ENABLED_SETTINGS } });
    adminAPI.updateSettings.mockResolvedValueOnce({ data: { data: DISABLED_SETTINGS } });
    setup();

    const toggle = await screen.findByRole('button', { name: /disable/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(adminAPI.updateSettings).toHaveBeenCalledWith({ aiAssistantEnabled: false });
    });
  });

  it('shows success toast after a successful toggle', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: ENABLED_SETTINGS } });
    adminAPI.updateSettings.mockResolvedValueOnce({ data: { data: DISABLED_SETTINGS } });
    setup();

    const toggle = await screen.findByRole('button', { name: /disable/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/disabled successfully/i) })
      );
    });
  });

  it('shows error toast when updateSettings fails', async () => {
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: ENABLED_SETTINGS } });
    adminAPI.updateSettings.mockRejectedValueOnce(new Error('Network error'));
    setup();

    const toggle = await screen.findByRole('button', { name: /disable/i });
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/failed to update/i) })
      );
    });
  });

  // ── Error loading settings ────────────────────────────────────────────────────

  it('shows error toast when getSettings fails on mount', async () => {
    adminAPI.getSettings.mockRejectedValueOnce(new Error('Server error'));
    setup();

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringMatching(/failed to load/i) })
      );
    });
  });
});
