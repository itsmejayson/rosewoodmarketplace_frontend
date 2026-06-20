import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react';
import { adminAPI } from '../api';

// ── Knowledge base ────────────────────────────────────────────────────────────
// Each entry has keyword triggers and an answer. Longer / more specific keyword
// lists are checked first because we score by number of keyword hits.
const KB = [
  // ── Registration & Accounts ──────────────────────────────────────────────────
  {
    keywords: ['proof', 'residency', 'document', 'barangay', 'utility', 'bill', 'certificate', 'upload', 'requirement'],
    answer: 'Sellers must upload a proof of residency when registering — a barangay certificate, utility bill, or any official document showing your address. Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10 MB). An admin reviews it before approving your account.',
  },
  {
    keywords: ['seller', 'register', 'sign up', 'apply', 'become', 'approval', 'approved', 'pending'],
    answer: 'To register as a seller, click Register and choose the Seller role. Provide your store name and upload a proof of residency document. An admin will review and approve your account. While pending you will see a Pending Approval screen when you log in.',
  },
  {
    keywords: ['buyer', 'register', 'account', 'create', 'sign up', 'join'],
    answer: 'Creating a buyer account is easy — click Register, fill in your name, email, password, and phone number, then select Buyer. Your account is active immediately with no approval needed.',
  },
  {
    keywords: ['password', 'forgot password', 'reset password', 'change password'],
    answer: 'You can change your password from the Profile page. Self-service password reset (via email) is not yet available — contact the marketplace admin for help if you are locked out.',
  },
  {
    keywords: ['role', 'change role', 'buyer to seller', 'seller to buyer'],
    answer: 'Role changes are not supported in the app. If you need a different role, register a new account with a different email address and select the desired role.',
  },
  // ── Payments ─────────────────────────────────────────────────────────────────
  {
    keywords: ['gcash', 'receipt', 'screenshot', 'upload', 'payment', 'verify', 'verification'],
    answer: 'For GCash payments: pay in your GCash app, then open your order detail page and upload a screenshot of the receipt. The seller reviews it and confirms your payment. You will get a notification once approved or rejected.',
  },
  {
    keywords: ['cash', 'cod', 'on delivery', 'cash on'],
    answer: 'Cash on Delivery/Pickup means you pay when you receive or pick up the order. The seller confirms receipt of your cash from their order detail page, which marks the order as Paid.',
  },
  {
    keywords: ['payment', 'pay', 'method', 'how to pay'],
    answer: 'Rosewood Marketplace supports two payment methods: GCash (upload a payment receipt screenshot for seller verification) and Cash (pay on delivery or pickup). Choose at checkout.',
  },
  // ── Cart ─────────────────────────────────────────────────────────────────────
  {
    keywords: ['cart', 'add to cart', 'basket', 'multiple seller', 'multi store'],
    answer: 'Your cart can hold products from multiple sellers at once. Use the checkboxes on the Cart page to select which items to checkout. The Order Summary breaks down costs per store, and a separate order is created for each seller when you checkout.',
  },
  {
    keywords: ['remove cart', 'delete cart', 'bulk remove', 'select items', 'remove multiple'],
    answer: 'On the Cart page, tick the checkboxes next to the items you want to remove (or use Select All), then click the Remove button in the toolbar. You can also remove items one at a time with the trash icon.',
  },
  // ── Orders ───────────────────────────────────────────────────────────────────
  {
    keywords: ['pickup', 'pick up', 'ready for pickup', 'notify pickup'],
    answer: 'For pickup orders the tracker shows: Awaiting Payment → Paid → Ready → Picked Up. Once you have prepared the order, click "Notify Buyer — Ready for Pickup". The buyer gets a notification and can come to collect. Mark it Delivered once picked up.',
  },
  {
    keywords: ['delivery', 'fulfillment', 'deliver'],
    answer: 'For delivery orders the tracker shows: Pending → Awaiting Payment → Paid → Processing → Shipped → Delivered. Choose Delivery at checkout and fill in your shipping address.',
  },
  {
    keywords: ['cancel', 'cancellation', 'cancel order'],
    answer: 'You can cancel an order when its status is Pending or Awaiting Payment. Once the seller confirms payment the order can no longer be cancelled — request a refund instead.',
  },
  {
    keywords: ['refund', 'return', 'money back', 'request refund'],
    answer: 'To request a refund, open the order detail page for a Paid or Delivered order and click Request Refund. Enter your reason and submit. The seller approves or rejects it. If approved, stock is restored and the order is marked Refunded.',
  },
  {
    keywords: ['order', 'track', 'status', 'where is my order', 'order status'],
    answer: 'Open My Orders from the navigation menu to track your orders. Delivery: Pending → Awaiting Payment → Paid → Processing → Shipped → Delivered. Pickup: Awaiting Payment → Paid → Ready → Picked Up. You receive a notification at each stage.',
  },
  {
    keywords: ['activity', 'activity log', 'order history', 'timeline'],
    answer: 'Every order has an Activity section showing a full timeline: when it was placed, payment confirmed, shipped, ready for pickup, picked up, and more. This is visible on the order detail page for both buyers and sellers.',
  },
  {
    keywords: ['checkout', 'place order', 'how to order', 'buy'],
    answer: 'To place an order: browse the Marketplace → add items to cart → go to Cart → select the items to buy → click Proceed to Checkout → fill in delivery details, choose Delivery or Pickup, select a payment method, and confirm.',
  },
  // ── Stock & Products ─────────────────────────────────────────────────────────
  {
    keywords: ['stock', 'inventory', 'out of stock', 'reserve', 'reservation', 'available', 'how many left'],
    answer: 'Stock is reserved the moment you add a product to your cart. The marketplace shows remaining stock on every product card — red means 5 or fewer, orange means 6–20, gray means plenty. Out-of-stock products cannot be added to cart.',
  },
  {
    keywords: ['low stock', 'stock alert', 'stock notification'],
    answer: 'Sellers receive a low-stock notification automatically when a product\'s stock drops to 10 units or below.',
  },
  {
    keywords: ['product', 'add product', 'list product', 'new product', 'create product'],
    answer: 'From the Seller Dashboard click + New Product. Fill in name, description, price, stock, category, and images. You can add variants (e.g. sizes with price modifiers) and add-ons (e.g. extras for an additional fee).',
  },
  {
    keywords: ['variant', 'addon', 'add-on', 'option', 'size', 'color', 'extra'],
    answer: 'Variants are product options like size or color where each choice has its own price. Add-ons are optional extras buyers can include for an additional fee (e.g. "Extra sauce +₱10"). Both are set up by the seller when creating a product.',
  },
  {
    keywords: ['share', 'share product', 'share link', 'copy link', 'send product'],
    answer: 'On any product detail page tap the Share icon (next to the heart). On mobile it opens your phone\'s native share sheet (WhatsApp, Messenger, copy link, etc.). On desktop it copies the product URL to your clipboard and shows a green checkmark.',
  },
  // ── Addresses ────────────────────────────────────────────────────────────────
  {
    keywords: ['address', 'saved address', 'delivery address', 'shipping address', 'save address'],
    answer: 'Go to Saved Addresses in the navigation menu to add, edit, or delete addresses. You can also check "Save this address" during checkout to save a new one. At checkout, saved addresses appear as selectable cards for quick reuse.',
  },
  // ── Notifications ────────────────────────────────────────────────────────────
  {
    keywords: ['notification', 'push', 'alert', 'enable notification', 'bell'],
    answer: 'Go to your Profile and scroll to Push Notifications. Click Enable and allow notifications in your browser. You\'ll get real-time alerts for order updates, payment confirmations, pickup readiness, messages, and more. Tap the bell icon in the nav to view all notifications.',
  },
  {
    keywords: ['unread notification', 'mark read', 'notification list', 'view notification'],
    answer: 'Tap the bell icon in the navigation bar to open the Notifications page. Unread notifications have a colored left border and a dot indicator. Tap "Mark all read" to clear them all, or tap any notification to go directly to the relevant page.',
  },
  {
    keywords: ['toast', 'popup', 'dismiss', 'close notification', 'alert disappear'],
    answer: 'Toast pop-up alerts auto-dismiss after 2.5 seconds. You can close them immediately by tapping the X button visible in the top-right corner of the toast.',
  },
  // ── Report Issue ─────────────────────────────────────────────────────────────
  {
    keywords: ['report', 'report issue', 'bug', 'problem', 'feedback', 'complain'],
    answer: 'Open the account menu (tap your avatar) and select "Report an Issue", or find the button at the bottom of your Profile page. Fill in a subject, describe the issue, and optionally attach a screenshot. Your report is sent to the admin team. Check "My Reports" on the same page to track the status and see admin responses.',
  },
  {
    keywords: ['report status', 'my report', 'report history', 'admin response', 'report resolved'],
    answer: 'On the Report an Issue page, switch to the "My Reports" tab to see all your submitted reports. Each shows its status: Open, In Progress, Resolved, or Dismissed. Admin notes or responses appear directly on the report card.',
  },
  // ── Misc ─────────────────────────────────────────────────────────────────────
  {
    keywords: ['favorite', 'wishlist', 'save product', 'heart', 'liked'],
    answer: 'Tap the heart icon on any product page to save it to your Favorites. View all saved items under Favorites in the navigation menu.',
  },
  {
    keywords: ['transaction', 'payment history', 'history'],
    answer: 'Your full payment history is in the Transactions page (navigation menu). It shows order number, store, payment method, status, and amount for every transaction.',
  },
  {
    keywords: ['review', 'rating', 'rate', 'feedback', 'star'],
    answer: 'After your order is marked Delivered you can leave a star rating and written comment on the product page or from the order detail page.',
  },
  {
    keywords: ['chat', 'message', 'contact seller', 'talk to seller'],
    answer: 'You can chat with the seller directly from your order detail page. Click Chat with Seller / Chat with Buyer to open a real-time chat window supporting text and images.',
  },
  {
    keywords: ['dashboard', 'sales', 'revenue', 'analytics'],
    answer: 'The Seller Dashboard shows your total revenue, order counts, a 30-day daily revenue bar chart, and top-selling products. It updates in real time via live notifications.',
  },
  {
    keywords: ['store', 'store page', 'store profile', 'store settings', 'store name'],
    answer: 'Each seller has a public store page showing all available products. Sellers can update their store name and delivery settings in Store Settings from the navigation menu.',
  },
  {
    keywords: ['search', 'filter', 'browse', 'find product', 'marketplace'],
    answer: 'Go to the Marketplace page to browse all products. Search by name, filter by category, and sort by price or newest. Every product card shows the remaining stock count so you know availability at a glance.',
  },
  {
    keywords: ['mobile', 'phone', 'responsive', 'app'],
    answer: 'Rosewood Marketplace is fully mobile-responsive — no app download needed. Product galleries, store listings, and the marketplace support swipe carousels on mobile browsers.',
  },
  {
    keywords: ['profile', 'update profile', 'edit profile', 'my profile'],
    answer: 'Go to Profile from the user menu to update your name, phone, address, and photo. Sellers can also update their store name here. The Report an Issue button is also at the bottom of the profile page.',
  },
  {
    keywords: ['admin', 'approve', 'pending seller', 'manage user', 'store management', 'issue reports'],
    answer: 'Admins can approve/reject seller applications, manage user accounts, view all transactions, toggle the AI assistant on/off, manage store products, force-cancel orders, and review user-submitted issue reports — all from the admin dashboard.',
  },
  {
    keywords: ['ai assistant', 'chatbot', 'disable chat', 'enable chat', 'market assistant'],
    answer: 'The AI assistant chatbot is controlled by the admin. If it\'s visible, it means the admin has it enabled. Admins can toggle it on or off from the System Settings page in the admin dashboard.',
  },
  {
    keywords: ['faq', 'help', 'guide', 'how does', 'how do'],
    answer: 'You can find detailed answers to common questions on our FAQ page — tap FAQ in the navigation menu or footer. Topics include buying, selling, payments, pickup, notifications, and reporting issues.',
  },
  {
    keywords: ['what is', 'about', 'rosewood', 'rp market', 'marketplace'],
    answer: 'Rosewood Marketplace (RP Market) is a local online marketplace for fresh food products and quality construction materials. It connects verified local sellers with buyers in a safe, easy-to-use platform.',
  },
];

const FALLBACK = "I'm not sure about that. Try browsing the FAQ page for detailed answers, or ask a more specific question about buying, selling, orders, or payments on Rosewood Marketplace.";

/**
 * tokenize(text)
 *
 * Normalises a string into an array of lowercase word tokens by:
 *   1. Converting to lowercase for case-insensitive matching.
 *   2. Replacing all non-alphanumeric characters with spaces (strips
 *      punctuation so "GCash?" and "GCash" both tokenise to ["gcash"]).
 *   3. Splitting on whitespace and removing empty strings.
 *
 * Used by findAnswer for both the user question and each keyword phrase.
 */
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * findAnswer(question)
 *
 * Scores every KB entry against the user's question using a simple
 * keyword-overlap heuristic:
 *   - For each keyword phrase in an entry, check whether ALL tokens of
 *     that phrase appear in the tokenised question.
 *   - If they do, add the phrase's token count to the entry's score.
 *     Longer phrases score higher than single words, so a match for
 *     "gcash receipt screenshot upload" beats a match for "gcash" alone —
 *     this prevents the wrong (more generic) entry from winning.
 *
 * Returns the answer text of the highest-scoring entry, or FALLBACK if
 * no entry scored at least 1 point.
 *
 * This approach is intentionally lightweight (no external NLP library) so
 * the widget works entirely offline once the page has loaded.
 */
function findAnswer(question) {
  const tokens = tokenize(question);
  let best = null;
  let bestScore = 0;

  for (const entry of KB) {
    let score = 0;
    for (const kw of entry.keywords) {
      const kwTokens = tokenize(kw);
      // Check if all tokens of this keyword phrase appear in the question
      if (kwTokens.every((t) => tokens.includes(t))) {
        score += kwTokens.length; // longer phrases score higher
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore > 0 ? best.answer : FALLBACK;
}

// ── UI ────────────────────────────────────────────────────────────────────────

const WELCOME = {
  role: 'assistant',
  content: "Hi! I'm the RP Market assistant. Ask me anything about buying, selling, orders, or payments. 😊",
};

const SUGGESTIONS = [
  'How do I place an order?',
  'How does GCash payment work?',
  'How do I report an issue?',
  'How does pickup work?',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${isUser ? 'bg-rosewood-600' : 'bg-muted border'}`}>
        {isUser
          ? <User className="h-3.5 w-3.5 text-white" />
          : <Bot className="h-3.5 w-3.5 text-rosewood-600" />
        }
      </div>
      <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
        isUser
          ? 'bg-rosewood-600 text-white rounded-tr-sm'
          : 'bg-muted text-foreground rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2">
      <div className="flex-shrink-0 h-7 w-7 rounded-full bg-muted border flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-rosewood-600" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

/**
 * AIChatWidget
 *
 * A floating AI-powered FAQ chatbot rendered as a fixed FAB in the bottom-
 * right corner of every page.  The widget is knowledge-base–driven (no
 * external API calls) so it works instantly and cannot incur extra cost.
 *
 * Visibility is controlled by the admin's `aiAssistantEnabled` setting
 * fetched from /api/settings on mount.  When disabled the component returns
 * null so it has zero DOM footprint.
 */
export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  // Whether the admin has enabled the AI assistant in system settings
  const [enabled, setEnabled] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * On mount, check whether the admin has enabled the AI assistant.
   * We default to `enabled: true` so the widget shows immediately while the
   * request is in flight — hiding it after the fact is less jarring than
   * a delayed appearance.
   */
  useEffect(() => {
    adminAPI.getSettings()
      .then(({ data }) => { if (data?.data?.aiAssistantEnabled === false) setEnabled(false); })
      .catch(() => {});
  }, []);

  /**
   * Auto-focus the textarea when the chat opens so the user can type
   * immediately without an extra click.  The 120 ms delay gives the CSS
   * transition time to finish so focus doesn't interfere with the animation.
   */
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  /**
   * Scroll to the bottom of the message list whenever a new message is added
   * or the typing indicator appears/disappears.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  /**
   * send(text?)
   *
   * Processes a user message.  `text` is provided when a suggestion button is
   * clicked; otherwise the value from the textarea (input state) is used.
   *
   * Flow:
   *   1. Append the user message to the conversation.
   *   2. Show the typing indicator (setThinking(true)).
   *   3. After 600 ms (simulates thinking) look up the answer in the KB.
   *   4. Append the assistant reply and hide the typing indicator.
   *
   * The 600 ms delay is intentional — it makes the bot feel more natural and
   * gives the user time to read their own message before the reply appears.
   */
  const send = (text) => {
    const question = (text ?? input).trim();
    if (!question || thinking) return;
    setInput('');

    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    // Small delay so the typing indicator is visible before the answer appears
    setTimeout(() => {
      const answer = findAnswer(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      setThinking(false);
    }, 600);
  };

  /** Resets the conversation back to the welcome message. */
  const reset = () => { setMessages([WELCOME]); setInput(''); };

  /**
   * handleKey — submits on Enter (without Shift) so the textarea behaves like
   * a single-line input for quick questions while still allowing Shift+Enter
   * for multi-line input.
   */
  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showSuggestions = messages.length === 1 && !thinking;

  if (!enabled) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open chat assistant"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-rosewood-600 hover:bg-rosewood-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
        )}
      </button>

      {/* Chat modal */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[75vh] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-rosewood-600 text-white">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">RP Market Assistant</p>
                <p className="text-xs text-rosewood-100 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} title="New conversation" className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <RotateCcw className="h-4 w-4" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {thinking && <TypingIndicator />}

            {showSuggestions && (
              <div className="pt-1 space-y-1.5">
                <p className="text-xs text-muted-foreground text-center">Quick questions:</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-rosewood-200 text-rosewood-700 bg-rosewood-50 hover:bg-rosewood-100 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t bg-background flex items-end gap-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder="Ask a question…"
              disabled={thinking}
              className="flex-1 resize-none rounded-xl border bg-muted px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rosewood-400 disabled:opacity-50 max-h-24 overflow-y-auto"
              style={{ height: '38px' }}
            />
            <button
              onClick={() => send()}
              disabled={thinking || !input.trim()}
              className="flex-shrink-0 h-9 w-9 rounded-full bg-rosewood-600 hover:bg-rosewood-700 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
