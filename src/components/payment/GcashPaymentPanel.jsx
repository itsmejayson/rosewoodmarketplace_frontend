import { useState, useRef } from 'react';
import { Upload, CheckCircle, Clock, XCircle, Loader2, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { orderAPI } from '../../api';
import { toast } from '../ui/toast';

const STATUS_UI = {
  PENDING: {
    icon: Clock,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 border-yellow-200',
    label: 'Waiting for Payment',
    description: 'Send the exact amount to the GCash number below, then upload your receipt.',
  },
  PENDING_VERIFICATION: {
    icon: Clock,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    label: 'Receipt Submitted',
    description: 'Your receipt is pending seller verification.',
  },
  APPROVED: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    label: 'Payment Confirmed',
    description: 'The seller has confirmed your payment.',
  },
  REJECTED: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-200',
    label: 'Payment Rejected',
    description: 'The seller could not verify your payment. Please re-upload or contact the seller.',
  },
};

const GCASH_NUMBER = import.meta.env.VITE_GCASH_NUMBER || '09XX-XXX-XXXX';
const GCASH_NAME = import.meta.env.VITE_GCASH_NAME || 'RP Market';

export default function GcashPaymentPanel({ transaction, orderId, onReceiptUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef(null);

  if (!transaction) return null;

  const { paymentStatus, referenceNumber, receiptImage, amount, rejectionReason } = transaction;
  const ui = STATUS_UI[paymentStatus] || STATUS_UI.PENDING;
  const StatusIcon = ui.icon;
  const canUpload = paymentStatus === 'PENDING' || paymentStatus === 'REJECTED';

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: `${text} copied to clipboard.` });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await orderAPI.submitReceipt(orderId, file);
      toast({ title: 'Receipt submitted!', description: 'Waiting for seller verification.' });
      onReceiptUploaded?.();
    } catch (err) {
      toast({
        title: 'Upload failed',
        description: err.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-start gap-3 rounded-lg border p-3 ${ui.bg}`}>
        <StatusIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${ui.color}`} />
        <div>
          <p className={`font-semibold text-sm ${ui.color}`}>{ui.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{ui.description}</p>
          {rejectionReason && (
            <p className="text-xs text-red-600 mt-1 font-medium">Reason: {rejectionReason}</p>
          )}
        </div>
      </div>

      {/* GCash payment details */}
      {paymentStatus !== 'APPROVED' && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Amount */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount to Send</p>
              <p className="text-3xl font-bold text-blue-600">â‚±{parseFloat(amount || 0).toFixed(2)}</p>
            </div>

            {/* GCash number */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Send GCash to</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold font-mono text-blue-700">{GCASH_NUMBER}</p>
                <button onClick={() => copyToClipboard(GCASH_NUMBER)} className="text-blue-500 hover:text-blue-700">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm font-medium text-blue-800">{GCASH_NAME}</p>
            </div>

            {/* Reference number */}
            {referenceNumber && (
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Reference Number</p>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <p className="font-mono font-bold text-lg">{referenceNumber}</p>
                  <button onClick={() => copyToClipboard(referenceNumber)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Steps */}
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">How to pay:</p>
              <p>1. Open GCash and tap <strong>Send Money</strong>.</p>
              <p>2. Enter <strong>{GCASH_NUMBER}</strong> and send <strong>â‚±{parseFloat(amount || 0).toFixed(2)}</strong>.</p>
              {referenceNumber && <p>3. Put <strong>{referenceNumber}</strong> as the message/note.</p>}
              <p>{referenceNumber ? '4.' : '3.'} Screenshot your receipt and upload it below.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipt upload */}
      {canUpload && (
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading receipt...</>
              : <><Upload className="h-4 w-4 mr-2" /> Upload GCash Receipt</>
            }
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Upload a clear screenshot of your GCash payment confirmation.
          </p>
        </div>
      )}

      {/* Submitted receipt preview */}
      {receiptImage && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">Submitted Receipt</p>
          <a href={receiptImage} target="_blank" rel="noreferrer">
            <img
              src={receiptImage}
              alt="GCash receipt"
              className="max-h-48 mx-auto rounded-lg border object-contain cursor-pointer hover:opacity-90"
            />
          </a>
          <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
        </div>
      )}
    </div>
  );
}

