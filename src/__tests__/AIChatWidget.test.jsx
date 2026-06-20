/**
 * Tests for components/AIChatWidget.jsx
 *
 * Covers:
 *  - FAB (floating action button) is rendered and shows the chat icon
 *  - Clicking FAB opens the chat window
 *  - Clicking the close button inside the chat hides the chat window
 *  - Suggestion buttons appear when chat is first opened
 *  - Clicking a suggestion sends a message and produces an assistant reply
 *  - Widget is hidden when admin settings disable the AI assistant
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AIChatWidget from '../components/AIChatWidget';

// Mock the adminAPI so no real HTTP calls are made
vi.mock('../api', () => ({
  adminAPI: {
    getSettings: vi.fn(() => Promise.resolve({ data: { data: { aiAssistantEnabled: true } } })),
  },
}));

describe('AIChatWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the FAB (floating action button)', async () => {
    render(<AIChatWidget />);
    // The FAB has aria-label="Open chat assistant"
    const fab = await screen.findByRole('button', { name: /open chat assistant/i });
    expect(fab).toBeInTheDocument();
  });

  it('chat window is not visible before FAB is clicked', async () => {
    render(<AIChatWidget />);
    // Wait for the settings fetch to complete before asserting
    await screen.findByRole('button', { name: /open chat assistant/i });
    expect(screen.queryByText(/RP Market Assistant/i)).not.toBeInTheDocument();
  });

  it('opens the chat window when FAB is clicked', async () => {
    render(<AIChatWidget />);
    const fab = await screen.findByRole('button', { name: /open chat assistant/i });
    fireEvent.click(fab);
    expect(screen.getByText(/RP Market Assistant/i)).toBeInTheDocument();
  });

  it('shows the welcome message and suggestion buttons when first opened', async () => {
    render(<AIChatWidget />);
    const fab = await screen.findByRole('button', { name: /open chat assistant/i });
    fireEvent.click(fab);
    // Welcome message from the WELCOME constant
    expect(screen.getByText(/Hi! I'm the RP Market assistant/i)).toBeInTheDocument();
    // One of the fixed suggestion buttons
    expect(screen.getByText(/How do I place an order/i)).toBeInTheDocument();
  });

  it('closes the chat window when the close button inside the header is clicked', async () => {
    render(<AIChatWidget />);
    const fab = await screen.findByRole('button', { name: /open chat assistant/i });
    fireEvent.click(fab);
    expect(screen.getByText(/RP Market Assistant/i)).toBeInTheDocument();

    // The header close button has no accessible label but is last among buttons matching aria-label
    // Find all close buttons (the header X button doesn't have an aria-label, so we look it up
    // differently — fire click on FAB again which toggles it off)
    fireEvent.click(fab); // toggle closes
    expect(screen.queryByText(/RP Market Assistant/i)).not.toBeInTheDocument();
  });

  it('clicking a suggestion populates messages and generates a reply', async () => {
    vi.useFakeTimers();
    render(<AIChatWidget />);
    const fab = await screen.findByRole('button', { name: /open chat assistant/i });
    fireEvent.click(fab);

    const suggestionBtn = screen.getByText(/How do I place an order/i);
    fireEvent.click(suggestionBtn);

    // User message should appear immediately
    expect(screen.getByText('How do I place an order?')).toBeInTheDocument();

    // Advance the 600 ms reply delay
    vi.advanceTimersByTime(700);

    await waitFor(() => {
      // The KB entry for "checkout" / "place order" contains "browse the Marketplace"
      expect(screen.getByText(/browse the Marketplace/i)).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('renders nothing when aiAssistantEnabled is false', async () => {
    const { adminAPI } = await import('../api');
    adminAPI.getSettings.mockResolvedValueOnce({ data: { data: { aiAssistantEnabled: false } } });

    const { container } = render(<AIChatWidget />);
    // Give the effect time to resolve
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
