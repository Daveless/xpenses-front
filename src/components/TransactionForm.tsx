'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, X } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
}

interface TransactionFormProps {
    onSuccess: () => void;
}

export const TransactionForm = ({ onSuccess }: TransactionFormProps) => {
    const { session } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [coupleId, setCoupleId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        amount: '',
        type: 'expense',
        scope: 'individual',
        category_id: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!session) return;
            try {
                // Fetch categories
                const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const catData = await catRes.json();
                setCategories(catData);

                // Fetch couple info to see if user has a couple
                const coupleRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/couple`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });
                const coupleData = await coupleRes.json();
                if (coupleData) setCoupleId(coupleData.id);
            } catch (err) {
                console.error('Error fetching categories or couple:', err);
            }
        };

        fetchData();
    }, [session]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    couple_id: formData.scope === 'couple' ? coupleId : null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear la transacción');
            }

            setFormData({
                amount: '',
                type: 'expense',
                scope: 'individual',
                category_id: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
            });
            onSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Agregar Transacción</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Monto</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            className="input"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="label">Fecha</label>
                        <input
                            type="date"
                            required
                            className="input"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Tipo</label>
                        <select
                            className="input"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="expense">Egreso / Gasto</option>
                            <option value="income">Ingreso</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Ámbito</label>
                        <select
                            className="input"
                            value={formData.scope}
                            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                        >
                            <option value="individual">Individual</option>
                            {coupleId && <option value="couple">Pareja</option>}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="label">Categoría</label>
                    <select
                        required
                        className="input"
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                        <option value="">Selecciona una categoría</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="label">Descripción</label>
                    <input
                        type="text"
                        className="input"
                        placeholder="Ej: Almuerzo oficina"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary py-3 mt-4 flex justify-center items-center"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Transacción'}
                </button>
            </form>
        </div>
    );
};
