import React from 'react';
import { useEffect, useState } from 'react';
import { Zap, ArrowUpRight, ArrowDownLeft, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

// Fallback packs — real pricing should come from admin-configured system_settings.
const FALLBACK_PACKS = [
  { id: 'pack_s', credits: 50, price: 4.99 },
  { id: 'pack_m', credits: 150, price: 12.99, popular: true },
  { id: 'pack_l', credits: 400, price: 29.99 },
];

export default function Wallet() {
  const { user, setUser } = useAuth();
  const [packs, setPacks] = useState(FALLBACK_PACKS);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    Promise.allSettled([api.get('/wallet/packs'), api.get('/wallet/transactions')]).then(
      ([packsRes, txRes]) => {
        if (packsRes.status === 'fulfilled') {
          const data = packsRes.value.data?.packs ?? packsRes.value.data;
          if (Array.isArray(data) && data.length) setPacks(data);
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data?.transactions ?? txRes.value.data ?? []);
        }
        setLoading(false);
      },
    );
  }, []);

  async function handleBuy(pack) {
    setPurchasingId(pack.id);
    try {
      const res = await api.post('/wallet/purchase', { packId: pack.id });
      const newBalance = res.data?.credits ?? (user?.credits ?? 0) + pack.credits;
      setUser((prev) => ({ ...prev, credits: newBalance }));
      setTransactions((prev) => [
        { id: `local_${Date.now()}`, type: 'credit', amount: pack.credits, description: `Purchased ${pack.credits} credits`, createdAt: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      // Payment gateway not wired up yet — surface that clearly instead of pretending it worked.
      alert('Payments aren\'t connected yet. This will work once the billing provider is configured.');
    } finally {
      setPurchasingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-1 font-['Space_Grotesk'] text-xl font-medium">Wallet</h1>
      <p className="mb-6 text-sm text-[#9494A0]">Manage your credits and see where they went.</p>

      {/* Balance */}
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

      {/* Buy credits */}
      <h2 className="mb-3 font-['Space_Grotesk'] text-sm font-medium text-[#9494A0]">Buy credits</h2>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className={`relative rounded-xl border p-5 ${
              pack.popular ? 'border-[#7C5CFC]' : 'border-[#26262E]'
            } bg-[#15151C]`}
          >
            {pack.popular && (
              <span className="absolute -top-2.5 right-4 rounded-full bg-[#7C5CFC] px-2 py-0.5 text-[10px] font-medium text-white">
                Most popular
              </span>
            )}
            <p className="font-['Space_Grotesk'] text-2xl font-medium">{pack.credits}</p>
            <p className="mb-4 text-xs text-[#9494A0]">credits</p>
            <button
              onClick={() => handleBuy(pack)}
              disabled={purchasingId === pack.id}
              className="w-full rounded-lg bg-[#7C5CFC] py-2 text-sm font-medium text-white transition hover:bg-[#8E72FD] disabled:opacity-60"
            >
              {purchasingId === pack.id ? 'Processing…' : `$${pack.price}`}
            </button>
          </div>
        ))}
      </div>

      {/* Transaction history */}
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
                  tx.type === 'credit' ? 'bg-[#2DD4BF]/15' : 'bg-[#7C5CFC]/15'
                }`}
              >
                {tx.type === 'credit' ? (
                  <ArrowDownLeft size={13} className="text-[#2DD4BF]" />
                ) : (
                  <ArrowUpRight size={13} className="text-[#7C5CFC]" />
                )}
              </div>
              <div className="flex-1">
                <p>{tx.description}</p>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#6B6B76]">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={tx.type === 'credit' ? 'text-[#2DD4BF]' : 'text-[#9494A0]'}>
                {tx.type === 'credit' ? '+' : '-'}
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
