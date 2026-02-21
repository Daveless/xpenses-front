'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
    Heart,
    Wallet,
    Plus,
    Users,
    ArrowUpRight,
    History,
    Loader2,
    Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CoupleInfo {
    id: string;
    user1: { full_name: string; email: string };
    user2: { full_name: string; email: string };
    couple_wallets: { balance: number };
}

interface Transaction {
    id: string;
    amount: number;
    type: string;
    description: string;
    date: string;
    profiles: { full_name: string };
    categories: { name: string; icon: string; color: string };
}

export default function CouplePage() {
    const { session, user } = useAuth();
    const [couple, setCouple] = useState<CoupleInfo | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [funding, setFunding] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!session) return;
        try {
            // Fetch couple info
            const cpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/couple`, {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const cpData = await cpRes.json();
            setCouple(cpData);

            if (cpData) {
                // Fetch couple transactions
                const txRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/couple/transactions`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const txData = await txRes.json();
                setTransactions(txData);
            }
        } catch (err) {
            console.error('Error fetching couple data:', err);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setInviting(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/couple`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ partner_email: inviteEmail }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            fetchData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setInviting(false);
        }
    };

    const handleFund = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session || !fundAmount) return;
        setFunding(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/couple/wallet/fund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ amount: parseFloat(fundAmount) }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            setFundAmount('');
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setFunding(false);
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <Layout>
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    </div>
                </Layout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <Layout>
                {!couple ? (
                    <div className="max-w-md mx-auto py-12">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center p-4 bg-pink-100 rounded-full mb-4">
                                <Heart className="w-10 h-10 text-pink-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900">Gastos en Pareja</h1>
                            <p className="text-slate-500 mt-2">Invita a tu pareja para empezar a gestionar gastos compartidos.</p>
                        </div>

                        <div className="card p-6">
                            <form onSubmit={handleInvite} className="space-y-4">
                                {error && (
                                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border-l-4 border-red-400">
                                        {error}
                                    </div>
                                )}
                                <div>
                                    <label className="label">Correo de tu pareja</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                        <input
                                            type="email"
                                            required
                                            placeholder="pareja@email.com"
                                            className="input pl-10"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="w-full btn-primary py-3 flex justify-center items-center"
                                >
                                    {inviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Vincular Pareja'}
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 flex items-center">
                                    Cuenta de Pareja
                                    <Heart className="w-6 h-6 ml-2 text-pink-500 fill-pink-500" />
                                </h1>
                                <p className="text-slate-500 mt-1">Conectado con {couple.user1.email === user?.email ? couple.user2.full_name : couple.user1.full_name}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Wallet Card */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="bg-gradient-to-br from-indigo-700 to-violet-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-indigo-100 text-sm font-medium opacity-80">Saldo Compartido</p>
                                        <h2 className="text-4xl font-black mt-2">
                                            ${couple.couple_wallets?.balance.toLocaleString() || '0'}
                                        </h2>
                                        <div className="mt-8 flex items-center text-indigo-100 text-xs font-semibold uppercase tracking-wider">
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Billetera Activa
                                        </div>
                                    </div>
                                    {/* Decorative circles */}
                                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                                    <div className="absolute -left-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl"></div>
                                </div>

                                <div className="card p-6">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                                        <ArrowUpRight className="w-5 h-5 mr-2 text-indigo-600" />
                                        Recargar Billetera
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-4">
                                        El dinero se descontará de tu cuenta individual y pasará a la cuenta compartida.
                                    </p>
                                    <form onSubmit={handleFund} className="space-y-4">
                                        <input
                                            type="number"
                                            required
                                            placeholder="Monto a recargar"
                                            className="input"
                                            value={fundAmount}
                                            onChange={(e) => setFundAmount(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={funding || !fundAmount}
                                            className="w-full btn bg-slate-900 text-white hover:bg-slate-800 py-3"
                                        >
                                            {funding ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Realizar Transferencia'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Transaction List */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-slate-900 flex items-center">
                                        <History className="w-5 h-5 mr-2" />
                                        Historial de Pareja
                                    </h3>
                                </div>

                                <div className="card overflow-hidden">
                                    <div className="divide-y divide-slate-100">
                                        {transactions.length > 0 ? (
                                            transactions.map((tx) => (
                                                <div key={tx.id} className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="text-lg">{tx.categories?.icon || '💰'}</div>
                                                        <div>
                                                            <p className="font-bold text-slate-900">{tx.description || tx.categories?.name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                {format(new Date(tx.date), "d 'de' MMM", { locale: es })} • Por {tx.profiles.full_name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-rose-600">-${tx.amount.toLocaleString()}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Gasto de Pareja</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-12 text-center text-slate-400">
                                                <p>Aún no hay gastos de pareja registrados.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Layout>
        </ProtectedRoute>
    );
}
