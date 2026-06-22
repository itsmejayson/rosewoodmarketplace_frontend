import { useState, useEffect } from 'react';
import { ChevronDown, ShoppingCart, Store, CreditCard, Package, RotateCcw, Shield, User, Star, MapPin, Heart, ArrowLeft, Flag, Bell, HelpCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { faqAPI } from '../api';

// Icon map for section names
const SECTION_ICON_MAP = {
  'General': Shield,
  'Buyer': ShoppingCart,
  'Seller': Store,
  'Orders & Payments': CreditCard,
  'Products & Reviews': Star,
  'Notifications': Bell,
  'Account & Profile': User,
  'Issues & Reports': Flag,
};
const SECTION_COLOR_MAP = {
  'General': 'text-rosewood-600',
  'Buyer': 'text-blue-600',
  'Seller': 'text-emerald-600',
  'Orders & Payments': 'text-purple-600',
  'Products & Reviews': 'text-yellow-600',
  'Notifications': 'text-amber-600',
  'Account & Profile': 'text-gray-600',
  'Issues & Reports': 'text-red-600',
};

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
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    faqAPI.list()
      .then(({ data }) => {
        const raw = data.data || [];
        if (raw.length === 0) return; // keep loading fallback below

        // Group by section, preserve order seen
        const map = new Map();
        raw.forEach((faq) => {
          if (!map.has(faq.section)) map.set(faq.section, []);
          map.get(faq.section).push(faq);
        });

        const built = Array.from(map.entries()).map(([label, faqs]) => ({
          label,
          icon: SECTION_ICON_MAP[label] || HelpCircle,
          color: SECTION_COLOR_MAP[label] || 'text-muted-foreground',
          faqs,
        }));
        setSections(built);
        setActiveSection(built[0]?.label || null);
      })
      .catch(() => {}) // silently fall through to empty state
      .finally(() => setLoading(false));
  }, []);

  const section = sections.find((s) => s.label === activeSection);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">Everything you need to know about the marketplace.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 ? (
        <p className="text-center text-muted-foreground py-20 text-sm">No FAQ content available yet.</p>
      ) : (
        <>
          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 snap-x">
            {sections.map(({ label, icon: Icon, color }) => (
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
                <FAQItem key={faq.id || faq.question} q={faq.question} a={faq.answer} />
              ))}
            </div>
          )}
        </>
      )}

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Still have questions? Contact the marketplace admin or reach out through your order's chat feature.</p>
      </div>
    </div>
  );
}
