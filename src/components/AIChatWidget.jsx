import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, RotateCcw } from 'lucide-react';

// ── Knowledge base ────────────────────────────────────────────────────────────
// Each entry has keyword triggers and an answer. Longer / more specific keyword
// lists are checked first because we score by number of keyword hits.
const KB = [
  {
    keywords: ['proof', 'residency', 'document', 'barangay', 'utility', 'bill', 'certificate', 'upload', 'requirement'],
    answer: 'Sellers must upload a proof of residency when registering — a barangay certificate of residency, utility bill, or any official document showing your current address. Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10 MB). An admin reviews it before approving your account.',
  },
  {
    keywords: ['seller', 'register', 'sign up', 'apply', 'become', 'approval', 'approved', 'pending'],
    answer: 'To register as a seller, click Register and choose the Seller role. You must provide your store name and upload a proof of residency document. An admin will review and approve your account. While pending you will see a Pending Approval screen when you log in.',
  },
  {
    keywords: ['buyer', 'register', 'account', 'create', 'sign up', 'join'],
    answer: 'Creating a buyer account is easy — click Register, fill in your name, email, password, and phone number, then select Buyer. Your account is active immediately with no approval needed.',
  },
  {
    keywords: ['gcash', 'receipt', 'screenshot', 'upload', 'payment', 'verify', 'verification'],
    answer: 'For GCash payments: pay in your GCash app, then open your order detail page and upload a screenshot of the receipt. The seller will review it and confirm your payment. You will get a notification once approved.',
  },
  {
    keywords: ['cash', 'cod', 'on delivery', 'cash on'],
    answer: 'Cash on Delivery/Pickup means you pay when you receive or pick up the order. The seller confirms receipt of your cash from their order detail page, which marks the order as Paid.',
  },
  {
    keywords: ['payment', 'pay', 'method', 'how to pay'],
    answer: 'Rosewood Marketplace supports two payment methods: GCash (upload a payment receipt screenshot) and Cash (pay on delivery or pickup). Choose your preferred method at checkout.',
  },
  {
    keywords: ['pickup', 'pick up', 'delivery', 'fulfillment', 'deliver'],
    answer: 'At checkout you choose Delivery (seller delivers to your address) or Pickup (you collect from the seller). Pickup orders skip the seller-confirmation step and go straight to Awaiting Payment.',
  },
  {
    keywords: ['cancel', 'cancellation', 'cancel order'],
    answer: 'You can cancel an order when its status is Pending or Awaiting Payment. Once the seller confirms payment the order can no longer be cancelled — you would need to request a refund instead.',
  },
  {
    keywords: ['refund', 'return', 'money back', 'request refund'],
    answer: 'To request a refund, open the order detail page for a Paid or Delivered order and click Request Refund. Enter your reason and submit. The seller will approve or reject it. If approved, the stock is restored and the order is marked Refunded.',
  },
  {
    keywords: ['stock', 'inventory', 'out of stock', 'reserve', 'reservation', 'available'],
    answer: 'Stock is reserved the moment you add a product to your cart — not at checkout. This prevents other buyers from purchasing the same units. If you remove the item or clear your cart the reserved stock is returned. Out-of-stock products cannot be added to cart.',
  },
  {
    keywords: ['cart', 'add to cart', 'basket'],
    answer: 'Your cart can only hold products from one seller at a time. Adding a product from a different seller will prompt you to clear your cart first. Stock is reserved immediately when you add an item.',
  },
  {
    keywords: ['order', 'track', 'status', 'where is my order', 'order status'],
    answer: 'Open My Orders from the navigation menu to track your orders. Statuses go: Pending → Awaiting Payment → Paid → Processing → Shipped → Delivered. You receive a notification at each status change.',
  },
  {
    keywords: ['checkout', 'place order', 'how to order', 'buy'],
    answer: 'To place an order: browse the Marketplace → add items to cart → go to Cart → click Proceed to Checkout → fill in your delivery details, choose Delivery or Pickup, select a payment method, and confirm your order.',
  },
  {
    keywords: ['address', 'saved address', 'delivery address', 'shipping address'],
    answer: 'Go to Saved Addresses in the navigation menu to add, edit, or delete addresses. You can save multiple addresses and choose one at checkout.',
  },
  {
    keywords: ['favorite', 'wishlist', 'save product', 'heart', 'liked'],
    answer: 'Tap the heart icon on any product page to save it to your Favorites. View all saved items under Favorites in the navigation menu.',
  },
  {
    keywords: ['transaction', 'payment history', 'history'],
    answer: 'Your full payment history is in the Transactions page (available in the navigation menu). It shows order number, store, payment method, status, and amount for every transaction.',
  },
  {
    keywords: ['review', 'rating', 'rate', 'feedback', 'star'],
    answer: 'After your order is marked Delivered you can leave a star rating and written comment on the product page or from the order detail page.',
  },
  {
    keywords: ['notification', 'push', 'alert', 'enable notification'],
    answer: 'Go to your Profile and scroll to Push Notifications. Click Enable and allow notifications in your browser. You will receive real-time alerts for order updates, payment confirmations, and messages.',
  },
  {
    keywords: ['chat', 'message', 'contact seller', 'talk to seller'],
    answer: 'You can chat with the seller directly from your order detail page. Click Chat with Seller / Chat with Buyer to open a real-time chat window. You can send text and images.',
  },
  {
    keywords: ['product', 'add product', 'list product', 'new product', 'create product'],
    answer: 'From the Seller Dashboard click + New Product. Fill in the product name, description, price, stock, category, and images. You can also add variants (e.g. sizes with price modifiers) and add-ons (e.g. extras for an additional fee).',
  },
  {
    keywords: ['variant', 'addon', 'add-on', 'option', 'size', 'color', 'extra'],
    answer: 'Variants are product options like size or color where each choice can have a different price. Add-ons are optional extras buyers can include for an additional fee (e.g. "Extra sauce +₱10"). Both are set up by the seller when creating a product.',
  },
  {
    keywords: ['dashboard', 'sales', 'revenue', 'report', 'analytics'],
    answer: 'The Seller Dashboard shows your total revenue, order counts, a 30-day daily revenue bar chart, and top-selling products. It updates in real time and refreshes every 30 seconds as a fallback.',
  },
  {
    keywords: ['low stock', 'stock alert', 'stock notification'],
    answer: 'You receive a low-stock notification automatically when a product\'s stock drops to 10 units or below.',
  },
  {
    keywords: ['store', 'store page', 'store profile', 'store settings', 'store name'],
    answer: 'Each seller has a public store page showing all their available products. Sellers can update their store name and profile in Store Settings from the navigation menu.',
  },
  {
    keywords: ['search', 'filter', 'browse', 'find product', 'marketplace'],
    answer: 'Go to the Marketplace page to browse all products. You can search by name, filter by category, and sort by price or newest. On mobile the product grid becomes a horizontal swipe carousel.',
  },
  {
    keywords: ['mobile', 'phone', 'responsive', 'app'],
    answer: 'Rosewood Marketplace is fully mobile-responsive. Product galleries, store listings, and the marketplace all support horizontal swipe carousels on mobile browsers — no app download needed.',
  },
  {
    keywords: ['profile', 'update profile', 'edit profile', 'my profile'],
    answer: 'Go to Profile from the user menu to update your name, phone number, address, and profile photo. Sellers can also update their store name here.',
  },
  {
    keywords: ['password', 'forgot password', 'reset password', 'change password'],
    answer: 'Password reset is not yet available as a self-service feature. Please contact the marketplace admin for assistance.',
  },
  {
    keywords: ['role', 'change role', 'buyer to seller', 'seller to buyer'],
    answer: 'Role changes are not supported in the app. If you need a different role, register a new account with a different email address and select the desired role.',
  },
  {
    keywords: ['admin', 'approve', 'pending seller', 'manage user', 'dispute'],
    answer: 'Admins can approve or reject seller applications, manage all user accounts, monitor all transactions, view online users in real time, and handle disputes — all from the admin dashboard.',
  },
  {
    keywords: ['faq', 'help', 'guide', 'how does', 'how do'],
    answer: 'You can find detailed answers to common questions on our FAQ page. Click FAQ in the navigation menu or footer to browse topics like buying, selling, payments, and account management.',
  },
  {
    keywords: ['what is', 'about', 'rosewood', 'rp market', 'marketplace'],
    answer: 'Rosewood Marketplace (RP Market) is a local online marketplace for fresh food products and quality construction materials. It connects verified local sellers with buyers in a safe, easy-to-use platform.',
  },
];

const FALLBACK = "I'm not sure about that. Try browsing the FAQ page for detailed answers, or ask a more specific question about buying, selling, orders, or payments on Rosewood Marketplace.";

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

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
  'How do I register as a seller?',
  'How do I track my order?',
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

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const send = (text) => {
    const question = (text ?? input).trim();
    if (!question || thinking) return;
    setInput('');

    const userMsg = { role: 'user', content: question };
    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    // Small delay so the typing indicator is visible
    setTimeout(() => {
      const answer = findAnswer(question);
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
      setThinking(false);
    }, 600);
  };

  const reset = () => { setMessages([WELCOME]); setInput(''); };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const showSuggestions = messages.length === 1 && !thinking;

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
