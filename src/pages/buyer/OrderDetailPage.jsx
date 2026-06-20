import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, Truck, Package, XCircle, Bike, CreditCard, Store, MessageSquare, X, RotateCcw, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { orderAPI, cartAPI, refundAPI } from '../../api';
import { toast } from '../../components/ui/toast';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '../../lib/utils';
import GcashPaymentPanel from '../../components/payment/GcashPaymentPanel';
import CashPaymentPanel from '../../components/payment/CashPaymentPanel';
import TransactionChat from '../../components/chat/TransactionChat';
const STATUS_STEPS = ['PENDING', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const STATUS_ICONS = {
  PENDING: Clock,
  AWAITING_PAYMENT: CreditCard,
  PAID: CheckCircle,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: XCircle,
};
const STATUS_LABELS = {
  PENDING: 'Pending',
  AWAITING_PAYMENT: 'Pay Now',
  PAID: 'Paid',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [reordering, setReordering] = useState(false);
  // Refund
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await orderAPI.getOrder(id);
      setOrder(data.data);
    } catch {
      toast({ title: 'Order not found', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-500" /></div>;
  if (!order) return <div className="container mx-auto px-4 py-20 text-center"><p>Order not found.</p></div>;

  const tx = order.transaction;
  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel = ['PENDING', 'AWAITING_PAYMENT'].includes(order.status);
  const canPay = order.status === 'AWAITING_PAYMENT';

  // Recompute totals from order items — the stored order.subtotal/totalAmount can be
  // wrong for orders placed before the variant-pricing fix.
  const computedSubtotal = (order.orderItems || []).reduce(
    (sum, item) => sum + parseFloat(item.totalPrice || 0), 0
  );
  const computedTotal = computedSubtotal + parseFloat(order.deliveryFee || 0);

  const canReorder = ['DELIVERED', 'CANCELLED'].includes(order.status);
  const refund = order.refund;
  const canRequestRefund = order.status === 'DELIVERED' && !refund;

  const handleReorder = async () => {
    setReordering(true);
    try {
      for (const item of order.orderItems) {
        await cartAPI.addItem({
          productId: item.productId,
          quantity: 1,
          ...(item.selectedOptions ? { selectedOptions: item.selectedOptions } : {}),
        });
      }
      toast({ title: 'Items added to cart' });
      navigate('/cart');
    } catch (err) {
      toast({ title: 'Reorder failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setReordering(false);
    }
  };

  const submitRefund = async () => {
    if (!refundReason.trim()) { toast({ title: 'Please provide a reason', variant: 'destructive' }); return; }
    setSubmittingRefund(true);
    try {
      await refundAPI.request(order.id, { reason: refundReason });
      toast({ title: 'Refund requested' });
      setShowRefundModal(false);
      setRefundReason('');
      fetchOrder();
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to request refund', variant: 'destructive' });
    } finally {
      setSubmittingRefund(false);
    }
  };

  const REFUND_BADGE = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold break-all">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
            {order.status.replace('_', ' ')}
          </span>
          {tx && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_STATUS_COLORS[tx.paymentStatus] || 'bg-gray-100 text-gray-800'}`}>
              {tx.paymentStatus}
            </span>
          )}
          {order.paymentMethod && (
            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {order.paymentMethod === 'GCASH' ? '📱 GCash' : '💵 Cash'}
            </span>
          )}
          {order.fulfillmentType && (
            <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
              {order.fulfillmentType === 'PICKUP' ? <Store className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
              {order.fulfillmentType === 'PICKUP' ? 'Pick Up' : 'Delivery'}
            </span>
          )}
          {canCancel && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-3 w-3 mr-1" /> Cancel Order
            </button>
          )}
          {canCancel && showCancelConfirm && (
            <div className="flex items-center gap-2 w-full mt-2">
              <p className="text-sm text-red-600 font-medium">Cancel this order?</p>
              <button
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await orderAPI.cancelOrder(id, 'Cancelled by buyer');
                    setOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
                    setShowCancelConfirm(false);
                    toast({ title: 'Order cancelled' });
                    fetchOrder();
                  } catch (err) {
                    toast({ title: err.response?.data?.message || 'Cancel failed', variant: 'destructive' });
                  } finally { setIsCancelling(false); }
                }}
                disabled={isCancelling}
                className="text-xs px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
              <button onClick={() => setShowCancelConfirm(false)} className="text-xs px-3 py-1 rounded-md border hover:bg-muted">
                Keep Order
              </button>
            </div>
          )}
          {tx && (
            <button
              onClick={() => setShowChat(true)}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <MessageSquare className="h-3 w-3" /> Chat with Seller
            </button>
          )}
          {canReorder && (
            <button
              onClick={handleReorder}
              disabled={reordering}
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {reordering ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Reorder
            </button>
          )}
          {canRequestRefund && (
            <button
              onClick={() => setShowRefundModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 px-2.5 py-0.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"
            >
              <RefreshCcw className="h-3 w-3" /> Request Refund
            </button>
          )}
          {refund && (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${REFUND_BADGE[refund.status] || 'bg-gray-100 text-gray-800'}`}>
              Refund {refund.status}
            </span>
          )}
        </div>
      </div>

      {/* Refund details card */}
      {refund && (
        <Card className={`mb-6 ${refund.status === 'APPROVED' ? 'border-green-200 bg-green-50' : refund.status === 'REJECTED' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className={`font-semibold flex items-center gap-1.5 ${refund.status === 'APPROVED' ? 'text-green-800' : refund.status === 'REJECTED' ? 'text-red-800' : 'text-orange-800'}`}>
                <RefreshCcw className="h-4 w-4" />
                Refund Request — {refund.status}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REFUND_BADGE[refund.status] || 'bg-gray-100 text-gray-800'}`}>
                {refund.status}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Your reason</p>
              <p className="mt-0.5">{refund.reason}</p>
            </div>
            {refund.notes && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Seller's note</p>
                <p className="mt-0.5">{refund.notes}</p>
              </div>
            )}
            {refund.processedAt && (
              <p className="text-xs text-muted-foreground">Processed on {formatDate(refund.processedAt)}</p>
            )}
            {!refund.processedAt && (
              <p className="text-xs text-muted-foreground">Submitted on {formatDate(refund.createdAt)} · Awaiting seller review</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Order status tracker */}
      {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-4 left-8 right-8 h-0.5 bg-muted" />
              <div
                className="absolute top-4 left-8 h-0.5 bg-rosewood-500 transition-all"
                style={{ width: `calc(${currentStep / (STATUS_STEPS.length - 1)} * (100% - 4rem))` }}
              />
              {STATUS_STEPS.map((step, idx) => {
                const Icon = STATUS_ICONS[step];
                const done = idx <= currentStep;
                const active = idx === currentStep;
                return (
                  <div key={step} className="relative flex flex-col items-center flex-1 z-10">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                      done ? 'bg-rosewood-600 border-rosewood-600 text-white' : 'bg-white border-muted-foreground/30 text-muted-foreground'
                    }`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <p className={`text-[10px] mt-1.5 text-center leading-tight ${active ? 'font-bold text-rosewood-600' : 'text-muted-foreground'}`}>
                      {STATUS_LABELS[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* PENDING banner — only for DELIVERY orders */}
      {order.status === 'PENDING' && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800">Waiting for seller to review your order</p>
              <p className="text-sm text-yellow-700">The seller will confirm your order and may add a delivery fee. You'll be notified when it's ready to pay.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AWAITING_PAYMENT banner */}
      {order.status === 'AWAITING_PAYMENT' && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-orange-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-orange-800">Order confirmed — please complete your payment</p>
              <p className="text-sm text-orange-700">
                Total amount due: <strong>{formatCurrency(computedTotal)}</strong>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: items + shipping */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Items Ordered</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 rounded border bg-muted flex-shrink-0 overflow-hidden">
                    <img src={item.productImage || '/placeholder-product.jpg'} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity} × ₱{parseFloat(item.unitPrice).toFixed(2)}</p>
                    {item.selectedOptions?.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedOptions.variants.map((v, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-200">
                            {v.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.selectedOptions?.addons?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedOptions.addons.map((a, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground border">
                            {a.name} +₱{parseFloat(a.price).toFixed(2)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium">₱{parseFloat(item.totalPrice).toFixed(2)}</p>
                </div>
              ))}
              <div className="border-t pt-2 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(computedSubtotal)}</span></div>
                {order.deliveryFee != null && parseFloat(order.deliveryFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><Bike className="h-3 w-3" /> Delivery Fee</span>
                    <span className="text-rosewood-600 font-medium">{formatCurrency(order.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold"><span>Total</span><span className="text-rosewood-600">{formatCurrency(computedTotal)}</span></div>
              </div>
            </CardContent>
          </Card>

          {order.fulfillmentType !== 'PICKUP' && (
            <Card>
              <CardHeader><CardTitle className="text-base">Shipping Address</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-0.5">
                <p className="font-medium">{order.shippingName}</p>
                <p className="text-muted-foreground">{order.shippingPhone}</p>
                <p className="text-muted-foreground">{order.shippingAddress}</p>
                <p className="text-muted-foreground">{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                <p className="text-muted-foreground">{order.shippingCountry}</p>
                {order.notes && <p className="text-muted-foreground pt-1 italic">Note: {order.notes}</p>}
              </CardContent>
            </Card>
          )}
          {order.fulfillmentType === 'PICKUP' && order.notes && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground italic">{order.notes}</CardContent>
            </Card>
          )}
        </div>

        {/* Right: payment + chat */}
        <div className="space-y-4">
          {/* Payment Panel — only when AWAITING_PAYMENT */}
          {tx && canPay && (
            <Card>
              <CardHeader><CardTitle className="text-base">
                {order.paymentMethod === 'GCASH' ? '📱 GCash Payment' : '💵 Cash Payment'}
              </CardTitle></CardHeader>
              <CardContent>
                {order.paymentMethod === 'GCASH'
                  ? <GcashPaymentPanel transaction={tx} orderId={order.id} onReceiptUploaded={fetchOrder} amount={computedTotal} />
                  : <CashPaymentPanel transaction={tx} amount={computedTotal} />
                }
              </CardContent>
            </Card>
          )}

          {/* Activity Log */}
          {(tx?.logs?.length > 0 || refund) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
              <CardContent>
                <ul>
                  {/* Transaction log entries */}
                  {(tx?.logs || []).map((log, idx) => {
                    const isLast = idx === (tx.logs.length - 1) && !refund;
                    return (
                      <li key={log.id} className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-rosewood-500 mt-1 flex-shrink-0" />
                          {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <p className="font-medium text-sm">{log.event ? log.event.replace(/_/g, ' ') : 'Event'}</p>
                          {log.description && <p className="text-sm text-muted-foreground mt-0.5">{log.description}</p>}
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                  {/* Refund entries */}
                  {refund && (
                    <>
                      <li className="flex gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-orange-400 mt-1 flex-shrink-0" />
                          {refund.processedAt && <div className="w-px flex-1 bg-border my-1" />}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <p className="font-medium text-sm">REFUND REQUESTED</p>
                          <p className="text-sm text-muted-foreground mt-0.5">Reason: {refund.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(refund.createdAt)}</p>
                        </div>
                      </li>
                      {refund.processedAt && (
                        <li className="flex gap-3 text-sm">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${refund.status === 'APPROVED' ? 'bg-green-500' : 'bg-red-500'}`} />
                          </div>
                          <div className="flex-1 min-w-0 pb-4">
                            <p className="font-medium text-sm">REFUND {refund.status}</p>
                            {refund.notes && <p className="text-sm text-muted-foreground mt-0.5">Seller note: {refund.notes}</p>}
                            <p className="text-xs text-muted-foreground mt-0.5">{formatDate(refund.processedAt)}</p>
                          </div>
                        </li>
                      )}
                    </>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Refund modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRefundModal(false)}>
          <div className="bg-background rounded-xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">Request a Refund</span>
              <button onClick={() => setShowRefundModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-4 space-y-3">
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tell us why you're requesting a refund…"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button className="bg-rosewood-600 hover:bg-rosewood-700" onClick={submitRefund} disabled={submittingRefund}>
                  {submittingRefund ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null} Submit Request
                </Button>
                <Button variant="ghost" onClick={() => setShowRefundModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat modal */}
      {showChat && tx && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50" onClick={() => setShowChat(false)}>
          <div
            className="bg-background rounded-xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden max-h-[80dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-rosewood-600" />
                <span className="font-semibold text-sm">Chat with Seller</span>
              </div>
              <button onClick={() => setShowChat(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <TransactionChat transactionId={tx.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
