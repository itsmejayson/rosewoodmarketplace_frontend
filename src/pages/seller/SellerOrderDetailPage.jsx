import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, XCircle, Banknote, Smartphone, MessageSquare, Package, Ban, Truck, Store, X, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { orderAPI, refundAPI } from '../../api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import TransactionChat from '../../components/chat/TransactionChat';

const NEXT_STATUS = { PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED' };

export default function SellerOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Refund state
  const [refundNotes, setRefundNotes] = useState('');
  const [showRefundReject, setShowRefundReject] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const { data } = await orderAPI.getSellerOrder(id);
      setOrder(data.data);
    } catch {
      toast({ title: 'Order not found', variant: 'destructive' });
      navigate('/seller/orders');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const act = async (fn, successMsg, { redirect } = {}) => {
    setIsActing(true);
    try {
      await fn();
      toast({ title: successMsg });
      if (redirect) navigate(redirect);
      else fetchOrder();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setIsActing(false);
      setShowRejectForm(false);
      setRejectReason('');
      setShowCancelConfirm(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-500" /></div>;
  if (!order) return null;

  const tx = order.transaction;
  const computedSubtotal = (order.orderItems || []).reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
  const computedTotal = computedSubtotal + parseFloat(order.deliveryFee || 0);
  const canApproveGcash = tx?.paymentMethod === 'GCASH' && tx?.paymentStatus === 'PENDING_VERIFICATION';
  const canConfirmCash = tx?.paymentMethod === 'CASH' && tx?.paymentStatus === 'PENDING' && order.status === 'AWAITING_PAYMENT';
  const nextStatus = NEXT_STATUS[order.status];
  const canCancelOrder = ['PENDING', 'AWAITING_PAYMENT'].includes(order.status);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <Link to="/seller/orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground text-sm">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${ORDER_STATUS_COLORS[order.status]}`}>
            {order.status.replace('_', ' ')}
          </span>
          {order.fulfillmentType && (
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-semibold text-foreground">
              {order.fulfillmentType === 'PICKUP' ? <Store className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
              {order.fulfillmentType === 'PICKUP' ? 'Pick Up' : 'Delivery'}
            </span>
          )}
          {tx && (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold border ${
              tx.paymentStatus === 'APPROVED' ? 'border-green-300 bg-green-50 text-green-700' :
              tx.paymentStatus === 'PENDING_VERIFICATION' ? 'border-blue-300 bg-blue-50 text-blue-700' :
              tx.paymentStatus === 'REJECTED' ? 'border-red-300 bg-red-50 text-red-700' :
              'border-border text-muted-foreground'
            }`}>
              {tx.paymentMethod === 'GCASH' ? <Smartphone className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
              {tx.paymentStatus}
            </span>
          )}
        </div>
      </div>

      {/* ── AWAITING_PAYMENT ─────────────────────────────────────────────── */}
      {order.status === 'AWAITING_PAYMENT' && order.fulfillmentType === 'DELIVERY' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Order confirmed. Waiting for buyer to pay <strong>{formatCurrency(computedTotal)}</strong>.
            </p>
          </CardContent>
        </Card>
      )}
      {order.status === 'AWAITING_PAYMENT' && order.fulfillmentType === 'PICKUP' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Store className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800">
              This is a <strong>pick-up order</strong>. Waiting for buyer to complete payment of <strong>{formatCurrency(computedTotal)}</strong>.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canApproveGcash && !showRejectForm && (
          <>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => act(() => orderAPI.approvePayment(order.id, { approved: true }), 'Payment approved!')} disabled={isActing}>
              {isActing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Approve GCash Payment
            </Button>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowRejectForm(true)} disabled={isActing}>
              <XCircle className="h-4 w-4 mr-2" /> Reject
            </Button>
          </>
        )}

        {showRejectForm && (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              className="flex-1 h-9 rounded-md border border-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Reason for rejection…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button variant="destructive" onClick={() => {
              if (!rejectReason.trim()) { toast({ title: 'Please provide a reason', variant: 'destructive' }); return; }
              act(() => orderAPI.approvePayment(order.id, { approved: false, rejectionReason: rejectReason }), 'Payment rejected');
            }} disabled={isActing}>
              {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </Button>
            <Button variant="ghost" onClick={() => { setShowRejectForm(false); setRejectReason(''); }}>Cancel</Button>
          </div>
        )}

        {canConfirmCash && (
          <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => act(() => orderAPI.confirmCash(order.id), 'Cash payment confirmed!')} disabled={isActing}>
            {isActing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Banknote className="h-4 w-4 mr-2" />}
            Confirm Cash Received
          </Button>
        )}

        {nextStatus && (
          <Button className="bg-rosewood-600 hover:bg-rosewood-700" onClick={() => act(() => orderAPI.updateStatus(order.id, nextStatus), `Order moved to ${nextStatus}`)} disabled={isActing}>
            {isActing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Mark as {nextStatus}
          </Button>
        )}

        {tx && (
          <Button variant="outline" onClick={() => setShowChat(!showChat)} className="w-full sm:w-auto sm:ml-auto">
            <MessageSquare className="h-4 w-4 mr-2" /> {showChat ? 'Hide Chat' : 'Chat with Buyer'}
          </Button>
        )}

        {canCancelOrder && !showCancelConfirm && (
          <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" onClick={() => setShowCancelConfirm(true)}>
            <Ban className="h-4 w-4 mr-2" /> Cancel Order
          </Button>
        )}
        {canCancelOrder && showCancelConfirm && (
          <div className="flex flex-wrap items-center gap-2 w-full">
            <p className="text-sm text-red-600 font-medium">Cancel this order?</p>
            <Button variant="destructive" size="sm" onClick={async () => {
              setIsActing(true);
              try {
                await orderAPI.cancelOrder(order.id, 'Cancelled by seller');
                setOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
                setShowCancelConfirm(false);
                toast({ title: 'Order cancelled' });
                fetchOrder();
              } catch (err) {
                toast({ title: err.response?.data?.message || 'Cancel failed', variant: 'destructive' });
              } finally { setIsActing(false); }
            }} disabled={isActing}>
              {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Cancel'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(false)}>Keep Order</Button>
          </div>
        )}
      </div>

      {/* ── Refund Requested (Task 12) ───────────────────────────────────── */}
      {order.refund && order.refund.status === 'PENDING' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
              <RotateCcw className="h-4 w-4 text-orange-600" /> Refund Requested
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-medium text-orange-700 uppercase tracking-wide">Buyer's Reason</p>
              <p className="text-orange-900 mt-0.5">{order.refund.reason || 'No reason provided'}</p>
            </div>

            {!showRefundReject ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => act(() => refundAPI.process(order.id, { approved: true, notes: refundNotes }), 'Refund approved')}
                  disabled={isActing}
                >
                  {isActing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve Refund
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRefundReject(true)}
                  disabled={isActing}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Reject Refund
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  className="w-full h-9 rounded-md border border-input px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring bg-white"
                  placeholder="Reason for rejecting this refund…"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (!refundNotes.trim()) { toast({ title: 'Please provide a reason for rejection', variant: 'destructive' }); return; }
                      act(() => refundAPI.process(order.id, { approved: false, notes: refundNotes }), 'Refund rejected');
                    }}
                    disabled={isActing}
                  >
                    {isActing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Reject'}
                  </Button>
                  <Button variant="ghost" onClick={() => { setShowRefundReject(false); setRefundNotes(''); }}>Cancel</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {order.refund && (order.refund.status === 'APPROVED' || order.refund.status === 'REJECTED') && (
        <div className={`flex flex-wrap items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          order.refund.status === 'APPROVED'
            ? 'border-green-200 bg-green-50 text-green-800'
            : 'border-red-200 bg-red-50 text-red-800'
        }`}>
          <RotateCcw className="h-4 w-4 flex-shrink-0" />
          <span className="font-semibold">Refund {order.refund.status}</span>
          {order.refund.notes && <span className="text-muted-foreground">— {order.refund.notes}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Buyer</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{order.buyer?.fullName}</p>
            <p className="text-muted-foreground">{order.buyer?.email}</p>
            <p className="text-muted-foreground">{order.buyer?.phone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              {order.fulfillmentType === 'PICKUP'
                ? <><Store className="h-4 w-4 text-green-600" /> Pick Up — Buyer Info</>
                : <><Truck className="h-4 w-4" /> Deliver To</>
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {order.fulfillmentType === 'PICKUP' ? (
              <>
                <p className="font-medium">{order.buyer?.fullName}</p>
                <p className="text-muted-foreground">{order.buyer?.email}</p>
                {order.buyer?.phone && <p className="text-muted-foreground">{order.buyer.phone}</p>}
                {order.notes && <p className="italic text-muted-foreground mt-1">Note: {order.notes}</p>}
              </>
            ) : (
              <>
                <p className="font-medium">{order.shippingName}</p>
                <p className="text-muted-foreground">{order.shippingAddress}</p>
                <p className="text-muted-foreground">{order.shippingCity}, {order.shippingState} {order.shippingZip}</p>
                <p className="text-muted-foreground">{order.shippingPhone}</p>
                {order.notes && <p className="italic text-muted-foreground">Note: {order.notes}</p>}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Items</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {order.orderItems?.map((item) => (
            <div key={item.id} className="flex gap-3 py-3">
              {item.product?.images?.[0] && (
                <img src={item.product.images[0].url} alt={item.productName} className="w-12 h-12 rounded-lg object-cover border flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.productName || item.product?.name}</p>
                <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                {item.selectedOptions?.variants?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.selectedOptions.variants.map((v, i) => (
                      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-200">
                        {v.groupName ? `${v.groupName}: ` : ''}{v.optionName}
                      </span>
                    ))}
                  </div>
                )}
                {item.selectedOptions?.addons?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.selectedOptions.addons.map((a, i) => (
                      <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground border">
                        +{a.name} {formatCurrency(a.price)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="font-semibold text-sm flex-shrink-0">{formatCurrency(item.totalPrice)}</p>
            </div>
          ))}
          <div className="pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(computedSubtotal)}</span></div>
            {order.deliveryFee != null && parseFloat(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1"><Bike className="h-3 w-3" /> Delivery Fee</span>
                <span className="text-rosewood-600 font-medium">{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total</span><span className="text-rosewood-600">{formatCurrency(computedTotal)}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Payment */}
      {tx && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Payment</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium flex items-center gap-1">
                {tx.paymentMethod === 'GCASH' ? <Smartphone className="h-3.5 w-3.5 text-blue-600" /> : <Banknote className="h-3.5 w-3.5 text-amber-600" />}
                {tx.paymentMethod}
              </span>
            </div>
            {tx.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-bold break-all text-right max-w-[60%]">{tx.referenceNumber}</span>
              </div>
            )}
            {tx.approvedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approved at</span>
                <span>{formatDate(tx.approvedAt)}</span>
              </div>
            )}
            {tx.receiptImage && (
              <div>
                <p className="text-muted-foreground mb-2">Submitted Receipt</p>
                <a href={tx.receiptImage} target="_blank" rel="noreferrer">
                  <img src={tx.receiptImage} alt="receipt" className="max-h-56 rounded-lg border object-contain cursor-pointer hover:opacity-90" />
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity log */}
      {tx?.logs?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Activity</CardTitle></CardHeader>
          <CardContent>
            <ul>
              {tx.logs.map((log, idx) => (
                <li key={log.id} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-rosewood-500 mt-1 flex-shrink-0" />
                    {idx < tx.logs.length - 1 && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-4">
                    <p className="font-medium">{log.event ? log.event.replace(/_/g, ' ') : 'Event'}</p>
                    {log.description && <p className="text-muted-foreground text-xs mt-0.5">{log.description}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
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
                <span className="font-semibold text-sm">Chat with Buyer</span>
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
