'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip as RechartsTooltip
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Plus,
    Calendar,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
    categories: Array<{ id: string; name: string; total: number; color: string; icon: string }>;
    totalExpenses: number;
    totalIncome: number;
    balance: number;
}

export default function DashboardPage() {
    const { session } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!session) return;
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/individual`, {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                });
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [session]);

    const COLORS = data?.categories.map(c => c.color) || ['#6366f1', '#f59e0b', '#ef4444', '#10b981'];

    return (
        <ProtectedRoute>
            <Layout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Dashboard</h1>
                            <p className="text-slate-500 mt-1">Resumen de tus finanzas personales</p>
                        </div>
                        <Link href="/transactions" className="btn-primary">
                            <Plus className="w-5 h-5 mr-2" />
                            Nueva Transacción
                        </Link>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="card p-6 border-l-4 border-indigo-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Balance Total</p>
                                    <p className={`text-2xl font-bold ${data && data.balance < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                        ${data?.balance.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="p-3 bg-indigo-50 rounded-lg">
                                    <Wallet className="w-6 h-6 text-indigo-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 border-l-4 border-emerald-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Ingresos</p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        +${data?.totalIncome.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6 border-l-4 border-rose-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-500 mb-1">Gastos</p>
                                    <p className="text-2xl font-bold text-rose-600">
                                        -${data?.totalExpenses.toLocaleString() || '0'}
                                    </p>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-lg">
                                    <TrendingDown className="w-6 h-6 text-rose-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Chart + List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Donut Chart */}
                        <div className="card p-6 flex flex-col">
                            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
                                Gastos por Categoría
                            </h3>
                            <div className="flex-grow min-h-[300px] w-full">
                                {data && data.categories.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.categories}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="total"
                                                nameKey="name"
                                            >
                                                {data.categories.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Total']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                        <PieChart className="w-12 h-12 opacity-20" />
                                        <p>No hay gastos registrados este mes</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Category table */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-slate-900">Desglose</h3>
                                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase">
                                    Este mes
                                </span>
                            </div>
                            <div className="space-y-4">
                                {data && data.categories.length > 0 ? (
                                    data.categories.map((cat) => (
                                        <div key={cat.id} className="flex items-center justify-between group cursor-default">
                                            <div className="flex items-center space-x-3">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                                                    style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                                                >
                                                    {cat.icon}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700">{cat.name}</p>
                                                    <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${(cat.total / data.totalExpenses) * 100}%`,
                                                                backgroundColor: cat.color
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900">${cat.total.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">
                                                    {((cat.total / data.totalExpenses) * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <p>Agrega transacciones para ver el detalle</p>
                                    </div>
                                )}
                            </div>
                            {data && data.categories.length > 5 && (
                                <button className="w-full mt-6 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center border-t border-slate-100 pt-4">
                                    Ver todas las categorías
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Layout>
        </ProtectedRoute>
    );
}
