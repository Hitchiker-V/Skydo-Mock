"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createInvoice, getClients } from '@/services/api';

interface Client {
    id: number;
    name: string;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
}

export default function NewInvoicePage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [clientId, setClientId] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [items, setItems] = useState<InvoiceItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);
    const router = useRouter();

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const response = await getClients();
                setClients(response.data);
            } catch (error) {
                console.error('Failed to fetch clients', error);
            }
        };
        fetchClients();
    }, []);

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
    };

    const calculateTotal = () => {
        return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createInvoice({
                client_id: parseInt(clientId),
                due_date: dueDate,
                currency: currency,
                items: items
            });
            router.push('/invoices');
        } catch (error) {
            console.error('Failed to create invoice', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Create New Invoice</h1>
                    <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:text-indigo-900">
                        &larr; Back
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Client</label>
                            <select
                                required
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select
                                required
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            >
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Due Date</label>
                            <input
                                type="date"
                                required
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                            />
                        </div>
                    </div>


                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Items</h2>
                            <button
                                type="button"
                                onClick={addItem}
                                className="text-sm text-indigo-600 hover:text-indigo-900"
                            >
                                + Add Item
                            </button>
                        </div>
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex gap-4 items-end">
                                    <div className="flex-grow">
                                        <label className="block text-xs font-medium text-gray-500">Description</label>
                                        <input
                                            type="text"
                                            required
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-500">Quantity</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-500">Unit Price</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={item.unit_price}
                                            onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        className="text-red-600 hover:text-red-900 pb-2"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-end text-xl font-bold text-black">
                            Total: ${calculateTotal().toFixed(2)}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                        >
                            Create Invoice
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
