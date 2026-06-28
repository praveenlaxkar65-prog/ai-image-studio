import React from 'react';
import { useEffect, useState } from 'react';
import { Zap, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Wallet() {
  const { user } = useAuth();
  const [packages, setPackages] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);
  const [purchaseNote, setPurchaseNote] = useState('');

  useEffect(() => {
    Promise.allSettled([api.get('/users/wallet/packages'), api.get('/users/wallet/transactions')]).then(
      ([packagesRes, txRes]) => {
        if (packagesRes.status === 'fulfilled') setPackages(packagesRes.value.data?.packages ?? []);
        if (txRes.status === 'fulfilled') setTransactions(txRes.value.data?.transactions ?? []);
        setLoading(false);
      },
    );
  }, []);

  async function handleBuy(pack) {
    setPurchasingId(pack.id);
    setPurchaseNote('');
    try {
      const res = await api.post('/users/wallet/purchase', { packageId: pack.id });
      setPurchaseNote(res.data?.message || 'Purchase flow not yet connected to a payment gateway.');
    } catch (err) {
      setPurchaseNote(err.response?.data?.message || 'Could not start purchase.');
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Wallet</h1>
      <p className="mb-6 text-sm text-[#9494A0]">Manage your credits and see where they went.</p>

      <div className="mb-8 flex items-center gap-4 rounded-xl border border-[#26262E] bg-[#15151C] p-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2DD4BF]/15">
          <Zap size={20} className="text-[#2DD4BF]" strokeWidth={1.75} />
        </div>
        <div>
          <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-[0.15em] text-[#6B6B76]">
            Current balance
          </p>
          <p className="font-['Space_Grotesk'] text-2xl font-medium">{user?.credits ?? 0} credits</p>
        </div>
      </div>

      <h2 className="mb-3 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">Buy credits</h2>

      {purchaseNote && (
        <p className="mb-4 rounded-lg border border-[#26262E] bg-[#15151C] px-3.5 py-2.5 text-sm text-[#9494A0]">
          {purchaseNote}
        </p>
      )}

      {loading ? (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl bg-[#15151C]" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <p className="mb-8 rounded-xl border border-dashed border-[#26262E] py-10 text-center text-sm text-[#9494A0]">
          No credit packages configured yet. Check back soon.
        </p>
      ) : (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {packages.map((pack) => (
            <div key={pack.id} className="rounded-xl border border-[#26262E] bg-[#15151C] p-5">
              <p className="font-['Space_Grotesk'] text-2xl font-medium">{pack.credits}</p>
              <p className="mb-4 text-xs text-[#9494A0]">credits</p>
              <button
                onClick={() => handleBuy(pack)}
                disabled={purchasingId === pack.id}
                className="w-full rounded-lg bg-[#7C5CFC] py-2 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:opacity-60"
              >
                {purchasingId === pack.id ? 'Processing…' : `${pack.price} ${pack.currency || 'USD'}`}
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-3 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">History</h2>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[#15151C]" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#26262E] py-10 text-center">
          <Receipt size={20} className="text-[#3a3a44]" strokeWidth={1.5} />
          <p className="text-sm text-[#9494A0]">No transactions yet.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#26262E]">
          {transactions.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-3 px-4 py-3 text-sm ${
                i !== transactions.length - 1 ? 'border-b border-[#26262E]' : ''
              }`}
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  tx.credits_amount > 0 ? 'bg-[#2DD4BF]/15' : 'bg-[#7C5CFC]/15'
                }`}
              >
                {tx.credits_amount > 0 ? (
                  <ArrowDownLeft size={13} className="text-[#2DD4BF]" />
                ) : (
                  <ArrowUpRight size={13} className="text-[#7C5CFC]" />
                )}
              </div>
              <div className="flex-1">
                <p>{tx.reason || tx.tool_key}</p>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                  {new Date(tx.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className={tx.credits_amount > 0 ? 'text-[#2DD4BF]' : 'text-[#9494A0]'}>
                {tx.credits_amount > 0 ? '+' : ''}
                {tx.credits_amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
