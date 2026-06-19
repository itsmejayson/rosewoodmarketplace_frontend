import { Banknote, CheckCircle, Clock } from 'lucide-react';

export default function CashPaymentPanel({ transaction, amount: amountOverride }) {
  if (!transaction) return null;

  const { paymentStatus } = transaction;
  const amount = amountOverride ?? transaction.amount;
  const isApproved = paymentStatus === 'APPROVED' || paymentStatus === 'PAID';

  return (
    <div className="space-y-4">
      {isApproved ? (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-green-700">Cash Payment Confirmed</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The seller has confirmed they received your cash payment.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-amber-700">Cash on Delivery</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Prepare <strong>₱{parseFloat(amount).toFixed(2)}</strong> in cash.
              The seller will confirm receipt once payment is handed over.
            </p>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">What to expect:</p>
        <p>1. The seller will prepare and deliver your order.</p>
        <p>2. Hand over <strong>₱{parseFloat(amount).toFixed(2)}</strong> in exact cash.</p>
        <p>3. The seller will confirm payment in the system.</p>
        <p>4. Your order status will update to <strong>PAID → DELIVERED</strong>.</p>
        <p className="pt-1">💬 Use the chat below for coordination with the seller.</p>
      </div>

      {!isApproved && (
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-background">
          <Banknote className="h-8 w-8 text-rosewood-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Amount Due</p>
            <p className="text-2xl font-bold text-rosewood-600">₱{parseFloat(amount).toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
