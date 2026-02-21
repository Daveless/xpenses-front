'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { TransactionForm } from '@/components/TransactionForm';
import {
    Receipt,
    Trash2,
    Plus,
    TrendingUp,
    TrendingDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Transaction {
    id: string;
    amount: number;
    type: 'income' | 'expense';
    scope: 'individual' | 'couple';
    description: string;
    date: string;
    categories: {
        name: string;
        icon: string;
        color: string;
    };
}

export default function TransactionsPage() {
    const { session } = useAuth();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState<'all' | 'individual' | 'couple'>('all');

    const fetchTransactions = useCallback(async () => {
        if (!session) return;
        try {
            const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/transactions`);
            if (filter !== 'all') url.searchParams.append('scope', filter);

            const response = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            const data = await response.json();
            setTransactions(data);
        } catch (err) {
            console.error('Error fetching transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [session, filter]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleDelete = async (id: string) => {
        if (!session || !confirm('¿Estás seguro de eliminar esta transacción?')) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` },
            });
            fetchTransactions();
        } catch (err) {
            console.error('Error deleting transaction:', err);
        }
    };

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h1 className="text-3xl font-extrabold text-slate-900">Transacciones</h1>
                        <button
                            onClick={() => setShowModal(!showModal)}
                            className="btn-primary"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            {showModal ? 'Ver Lista' : 'Nueva Transacción'}
                        </button>
                    </div>

                    {showModal ? (
                        <div className="max-w-2xl mx-auto">
                            <TransactionForm
                                onSuccess={() => {
                                    setShowModal(false);
                                    fetchTransactions();
                                }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setFilter('individual')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'individual'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    Individuales
                                </button>
                                <button
                                    onClick={() => setFilter('couple')}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'couple'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    Pareja
                                </button>
                            </div>

                            {/* Transaction List */}
                            <div className="card overflow-hidden">
                                <div className="divide-y divide-slate-100">
                                    {loading ? (
                                        <div className="p-12 flex justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                                        </div>
                                    ) : transactions.length > 0 ? (
                                        transactions.map((tx) => (
                                            <div key={tx.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center space-x-4">
                                                    <div
                                                        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
                                                        style={{ backgroundColor: `${tx.categories?.color || '#cbd5e1'}20`, color: tx.categories?.color }}
                                                    >
                                                        {tx.categories?.icon || '💰'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{tx.description || tx.categories?.name}</p>
                                                        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium mt-0.5">
                                                            <span className="flex items-center">
                                                                {format(new Date(tx.date), "d 'de' MMMM", { locale: es })}
                                                            </span>
                                                            <span>•</span>
                                                            <span className={`uppercase px-1.5 py-0.5 rounded ${tx.scope === 'couple' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'
                                                                }`}>
                                                                {tx.scope === 'couple' ? 'Pareja' : 'Solo yo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-right">
                                                        <p className={`font-bold text-lg ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                            {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString()}
                                                        </p>
                                                        <p className="text-xs text-slate-400 capitalize">{tx.categories?.name}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(tx.id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-20 text-center text-slate-400">
                                            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                            <p className="text-lg">No se encontraron transacciones</p>
                                            <button
                                                onClick={() => setShowModal(true)}
                                                className="mt-4 text-indigo-600 font-semibold hover:underline"
                                            >
                                                Agrega tu primera transacción aquí
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
