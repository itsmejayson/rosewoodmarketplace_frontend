import { useState } from 'react';
import { ChevronDown, ShoppingCart, Store, CreditCard, Package, RotateCcw, Shield, User, Star, MapPin, Heart } from 'lucide-react';

const SECTIONS = [
  {
    label: 'General',
    icon: Shield,
    color: 'text-rosewood-600',
    faqs: [
      {
        q: 'What is Rosewood Marketplace?',
        a: 'Rosewood Marketplace (RP Market) is a local online marketplace where buyers can purchase fresh food products and quality construction materials from verified local sellers. You can browse products, place orders, and pay via GCash or Cash.',
      },
      {
        q: 'Do I need an account to browse products?',
        a: 'No. You can browse the marketplace, view stores, and see product details without an account. However, you need to be logged in as a buyer to add items to your cart and place an order.',
      },
      {
        q: 'Is Rosewood Marketplace available on mobile?',
        a: 'Yes. The website is fully responsive and works on any mobile browser. Product galleries, store listings, and the marketplace all support horizontal swipe carousels on mobile devices.',
      },
    ],
  },
  {
    label: 'Buyer',
    icon: ShoppingCart,
    color: 'text-blue-600',
    faqs: [
      {
        q: 'How do I create a buyer account?',
        a: 'Click "Register" on the navigation bar, fill in your name, email, password, and phone number, then select "Buyer" as your role. Your account is active immediately — no approval required.',
      },
      {
        q: 'Can I buy from multiple sellers in one order?',
        a: 'Currently your cart can only contain products from one seller at a time. If you try to add a product from a different seller, you will be asked to clear your cart first.',
      },
      {
        q: 'How does stock work? Can a product sell out while I\'m shopping?',
        a: 'Yes. Stock is reserved the moment you add a product to your cart — not at checkout. This means other buyers cannot purchase the same units you have reserved. If you remove an item or clear your cart, the reserved stock is returned.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'Two payment methods are supported: GCash (you upload a screenshot of your payment receipt for the seller to verify) and Cash on Delivery / Cash on Pickup (you pay when you receive or pick up the order).',
      },
      {
        q: 'What is the difference between Delivery and Pickup?',
        a: 'Delivery means the seller will deliver the order to your address. Pickup means you collect the order from the seller\'s location. With Pickup, the order skips the seller-confirmation step and goes straight to Awaiting Payment.',
      },
      {
        q: 'How do I pay with GCash?',
        a: 'During checkout select GCash as your payment method. After placing the order, open the order detail page and upload a screenshot of your GCash payment receipt. The seller will review and confirm your payment.',
      },
      {
        q: 'Can I save multiple delivery addresses?',
        a: 'Yes. Go to "Saved Addresses" in the navigation menu to add, edit, or delete addresses. You can select any saved address during checkout.',
      },
      {
        q: 'How do I track my order?',
        a: 'Open "My Orders" from the navigation menu. Each order shows its current status: Pending → Awaiting Payment → Paid → Processing → Shipped → Delivered. You also receive notifications at each status change.',
      },
      {
        q: 'Can I cancel my order?',
        a: 'Orders in Pending or Awaiting Payment status can be cancelled. Once the seller has confirmed payment, cancellation is no longer available from your side — you would need to request a refund instead.',
      },
      {
        q: 'How do I request a refund?',
        a: 'Open the order detail page for a Paid or Delivered order and click "Request Refund". Provide your reason and submit. The seller will review and approve or reject the request. If approved, your stock is also restored so the products return to inventory.',
      },
      {
        q: 'Can I save products to a wishlist?',
        a: 'Yes. On any product page click the heart icon to add it to your Favorites. View all saved items under "Favorites" in the navigation menu.',
      },
      {
        q: 'Where can I see my payment history?',
        a: 'Go to "Transactions" in the navigation menu. It lists all your past transactions with order number, store, payment method, status, and amount.',
      },
    ],
  },
  {
    label: 'Seller',
    icon: Store,
    color: 'text-emerald-600',
    faqs: [
      {
        q: 'How do I register as a seller?',
        a: 'Click "Register" and select "Seller" as your role. You must provide your store name and upload a proof of residency document (barangay certificate of residency, utility bill, or any official document showing your current address). Accepted formats: PDF, DOC, DOCX, JPG, PNG, WEBP (max 10 MB). An admin will review your application before your account is approved.',
      },
      {
        q: 'Why do I need to submit a proof of residency?',
        a: 'To protect buyers and maintain a trustworthy marketplace, all sellers are verified by an admin before they can list products. The proof of residency confirms that you are a real, locally-based seller.',
      },
      {
        q: 'How long does seller approval take?',
        a: 'Approval is done manually by an admin. Once approved you will receive a notification and can immediately start listing products. While pending, you will see a "Pending Approval" screen when you log in.',
      },
      {
        q: 'How do I add a product?',
        a: 'From the Seller Dashboard click "+ New Product", or go to "Products" → "New Product". Fill in the product name, description, price, stock quantity, and category. You can also add product variants (e.g. size, color) and add-ons with their own prices. Upload at least one product image.',
      },
      {
        q: 'How does stock management work?',
        a: 'You set the stock quantity when creating or editing a product. Stock decreases when a buyer adds your product to their cart (reserved instantly) and restores if they remove the item or their cart is cleared. When an order is paid, the sales count increments. You get a low-stock notification when stock reaches 10 or below.',
      },
      {
        q: 'How do I confirm a GCash payment?',
        a: 'You will receive a notification when a buyer submits a GCash receipt. Open the order detail page, review the receipt image, then click "Approve GCash Payment" or "Reject". If you reject, enter the reason so the buyer is informed.',
      },
      {
        q: 'How do I confirm a Cash payment?',
        a: 'Once you have physically received cash from the buyer, open the order detail page and click "Confirm Cash Received". This marks the order as Paid and notifies the buyer.',
      },
      {
        q: 'How do I process a refund request?',
        a: 'Go to "Refunds" in the navigation menu. Open the refund request and click "Approve" or "Reject" with a note. Approving a refund updates the order status to Refunded, restores the product stock, and reverses the sales count.',
      },
      {
        q: 'Can I chat with buyers?',
        a: 'Yes. On any order detail page that has a linked transaction, click "Chat with Buyer" to open a real-time chat window. You can send text messages and images.',
      },
      {
        q: 'Where can I see my sales performance?',
        a: 'The Seller Dashboard shows total revenue, order counts, a 30-day daily revenue bar chart, and your top-selling products. The dashboard updates in real time via live notifications and refreshes every 30 seconds as a fallback.',
      },
      {
        q: 'Where do I view my transactions?',
        a: 'Go to "Transactions" in the navigation menu. It shows all orders with payment method, status, buyer details, amount, and date. You can filter by payment method.',
      },
      {
        q: 'Can I see reviews for my products?',
        a: 'Yes. Go to "Reviews" in the navigation menu to see all buyer reviews left on your products, including star ratings and comments.',
      },
    ],
  },
  {
    label: 'Orders & Payments',
    icon: CreditCard,
    color: 'text-purple-600',
    faqs: [
      {
        q: 'What are the order statuses?',
        a: 'Pending (order placed, awaiting seller confirmation) → Awaiting Payment (confirmed by seller or Pickup order) → Paid (payment confirmed) → Processing (seller is preparing the order) → Shipped (order is on its way) → Delivered (order received). Orders can also be Cancelled or Refunded.',
      },
      {
        q: 'What are the payment statuses?',
        a: 'Pending (no action yet) → Pending Verification (buyer uploaded GCash receipt) → Approved / Paid (seller confirmed payment) → Rejected (receipt not accepted) → Refunded (refund was approved).',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Rosewood Marketplace does not store any card numbers or GCash PIN. GCash payments are handled by the buyer directly in the GCash app; only the receipt screenshot is uploaded for seller verification.',
      },
      {
        q: 'What happens if a seller rejects my GCash receipt?',
        a: 'You will receive a notification with the rejection reason. You can upload a new receipt from the order detail page, or contact the seller via the in-order chat.',
      },
    ],
  },
  {
    label: 'Products & Reviews',
    icon: Star,
    color: 'text-yellow-600',
    faqs: [
      {
        q: 'How do I search for products?',
        a: 'Go to the Marketplace page. You can search by product name, filter by category, and sort by price or newest. On mobile the product grid becomes a horizontal swipe carousel.',
      },
      {
        q: 'What are product variants and add-ons?',
        a: 'Variants are options like size or color where each choice can have a different price (e.g. Small = ₱50, Large = ₱70). Add-ons are optional extras a buyer can include for an additional fee (e.g. "Extra sauce +₱10"). Both are configured by the seller when creating a product.',
      },
      {
        q: 'How do I leave a review?',
        a: 'After your order is marked as Delivered you can leave a star rating and written comment on the product page or from the order detail page.',
      },
      {
        q: 'Can I see a store\'s full product list?',
        a: 'Yes. Click on any store name to open the Store page, which lists all of that seller\'s available products and their store profile.',
      },
    ],
  },
  {
    label: 'Account & Profile',
    icon: User,
    color: 'text-gray-600',
    faqs: [
      {
        q: 'How do I update my profile?',
        a: 'Go to "Profile" from the user menu. You can update your full name, phone number, address, and profile photo. Sellers can also update their store name from the profile page.',
      },
      {
        q: 'How do I enable push notifications?',
        a: 'Go to your Profile and scroll to the "Push Notifications" section. Click "Enable" and allow notifications when your browser prompts you. You will then receive real-time alerts for order updates, payment confirmations, and messages.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Password reset is not yet available as a self-service feature. Please contact the marketplace administrator for assistance.',
      },
      {
        q: 'Can I change my role from Buyer to Seller?',
        a: 'Role changes are not supported through the app. If you need to register as a seller, create a new account with a different email address and select the Seller role during registration.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium text-sm sm:text-base">{q}</span>
        <ChevronDown className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].label);

  const section = SECTIONS.find((s) => s.label === activeSection);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Everything you need to know about Rosewood Marketplace.</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 snap-x">
        {SECTIONS.map(({ label, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => setActiveSection(label)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap snap-start transition-colors ${
              activeSection === label
                ? 'bg-rosewood-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Icon className={`h-4 w-4 ${activeSection === label ? 'text-white' : color}`} />
            {label}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      {section && (
        <div className="bg-card border rounded-xl px-5 divide-y-0">
          {section.faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      )}

      {/* Contact footer */}
      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Still have questions? Contact the marketplace admin or reach out through your order's chat feature.</p>
      </div>
    </div>
  );
}
