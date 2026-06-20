import { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { transactionAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_COLOR = {
  PENDING:              'bg-yellow-100 text-yellow-700',
  PENDING_VERIFICATION: 'bg-blue-100 text-blue-700',
  APPROVED:             'bg-green-100 text-green-700',
  PAID:                 'bg-green-100 text-green-700',
  REJECTED:             'bg-red-100 text-red-700',
  REFUNDED:             'bg-gray-100 text-gray-600',
};

const METHOD_ICON = { CASH: Banknote, GCASH: Smartphone };

export default function SellerTransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('ALL');

  const fetchTransactions = async (p = 1) => {
    setIsLoading(true);
    try {
      const params = { page: p, limit: 10 };
      if (paymentMethod !== 'ALL') params.paymentMethod = paymentMethod;
      const { data } = await transactionAPI.sellerTransactions(params);
      setTransactions(data.data ?? data);
      if (data.meta) setMeta(data.meta);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setPage(1); fetchTransactions(1); }, [paymentMethod]);

  const goToPage = (p) => { setPage(p); fetchTransactions(p); };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div>
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-muted-foreground text-sm">{meta.total} total transactions</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Methods</SelectItem>
            <SelectItem value="GCASH">GCash</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No transactions found.</p>
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Order</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Buyer</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Method</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((tx) => {
                  const MethodIcon = METHOD_ICON[tx.paymentMethod] || CreditCard;
                  return (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">#{tx.order?.orderNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {tx.order?.fulfillmentType?.toLowerCase()}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-sm">{tx.order?.buyer?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{tx.order?.buyer?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex items-center gap-1.5">
                          <MethodIcon className="h-4 w-4 text-muted-foreground" />
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[tx.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {tx.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(tx.amount ?? tx.order?.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                        {formatDate(tx.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {meta.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page} of {meta.pages}</span>
              <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => goToPage(page + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
