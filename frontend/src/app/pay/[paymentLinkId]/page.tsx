"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getPublicInvoice, triggerMockPayment } from '@/services/api';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
}

interface Invoice {
    id: number;
    status: string;
    due_date: string;
    total_amount: number;
    items: InvoiceItem[];
}

export default function PublicPaymentPage() {
    const { paymentLinkId } = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');

    useEffect(() => {
        const fetchInvoice = async () => {
            if (paymentLinkId) {
                try {
                    const response = await getPublicInvoice(paymentLinkId as string);
                    setInvoice(response.data);
                } catch (error) {
                    console.error('Failed to fetch invoice', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchInvoice();
    }, [paymentLinkId]);

    const handlePayment = async (status: 'success' | 'failed') => {
        setPaymentStatus('processing');
        try {
            await triggerMockPayment(paymentLinkId as string, status);
            setPaymentStatus(status);
        } catch (error) {
            console.error('Payment failed', error);
            setPaymentStatus('failed');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
    if (!invoice) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Invoice not found</div>;

    if (paymentStatus === 'success' || invoice.status === 'paid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600">Thank you for your payment of ${invoice.total_amount}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-8 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.id}</h1>
                        <span className="text-sm text-gray-500">Due: {invoice.due_date}</span>
                    </div>
                </div>

                <div className="px-6 py-6">
                    <table className="min-w-full divide-y divide-gray-200 mb-6">
                        <thead>
                            <tr>
                                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Item</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Qty</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Price</th>
                                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoice.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="py-3 text-sm text-gray-900">{item.description}</td>
                                    <td className="py-3 text-sm text-gray-500 text-right">{item.quantity}</td>
                                    <td className="py-3 text-sm text-gray-500 text-right">${item.unit_price}</td>
                                    <td className="py-3 text-sm text-gray-900 text-right font-medium">
                                        ${(item.quantity * item.unit_price).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={3} className="pt-4 text-right text-lg font-bold text-gray-900">Total Due</td>
                                <td className="pt-4 text-right text-2xl font-bold text-indigo-600">${invoice.total_amount}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Pay with Mock Provider</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handlePayment('success')}
                                disabled={paymentStatus === 'processing'}
                                className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-medium shadow-sm disabled:opacity-50"
                            >
                                {paymentStatus === 'processing' ? 'Processing...' : 'Simulate Successful Payment'}
                            </button>
                            <button
                                onClick={() => handlePayment('failed')}
                                disabled={paymentStatus === 'processing'}
                                className="flex-1 bg-white text-red-600 border border-red-300 py-3 px-4 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 font-medium shadow-sm disabled:opacity-50"
                            >
                                Simulate Failed Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
