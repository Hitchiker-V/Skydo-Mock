"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getInvoice, downloadInvoicePDF, downloadFiraPDF } from '@/services/api';
import Link from 'next/link';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    unit_price: number;
}

interface Client {
    id: number;
    name: string;
    email: string;
    address: string;
}

interface Invoice {
    id: number;
    status: string;
    due_date: string;
    total_amount: number;
    payment_link_id: string;
    client: Client;
    items: InvoiceItem[];
}

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const response = await getInvoice(Number(id));
                setInvoice(response.data);
            } catch (error) {
                console.error('Failed to fetch invoice', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchInvoice();
        }
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!invoice) return <div className="p-8">Invoice not found</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-8 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoice #{invoice.id}</h1>
                            <p className="text-sm text-gray-500 mt-1">Due Date: {invoice.due_date}</p>
                            <div className="mt-4 flex space-x-3">
                                <button
                                    onClick={async () => {
                                        try {
                                            const blob = await downloadInvoicePDF(invoice.id);
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `invoice_${invoice.id}.pdf`;
                                            document.body.appendChild(a);
                                            a.click();
                                            a.remove();
                                            window.URL.revokeObjectURL(url);
                                        } catch (error) {
                                            console.error('Failed to download invoice', error);
                                            alert('Failed to download invoice');
                                        }
                                    }}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Download PDF
                                </button>
                                {invoice.status === 'paid' && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const blob = await downloadFiraPDF(invoice.id);
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `fira_${invoice.id}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                                window.URL.revokeObjectURL(url);
                                            } catch (error) {
                                                console.error('Failed to download FIRA', error);
                                                alert('Failed to download FIRA');
                                            }
                                        }}
                                        className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Download FIRA
                                    </button>
                                )}
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {invoice.status.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Payment Link</h3>
                    <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${invoice.payment_link_id}`}
                            className="flex-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/pay/${invoice.payment_link_id}`);
                                alert('Link copied!');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Copy Link
                        </button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Bill To</h2>
                        <div className="text-sm text-gray-900">
                            <p className="font-medium">{invoice.client.name}</p>
                            <p>{invoice.client.email}</p>
                            <p className="whitespace-pre-line">{invoice.client.address}</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4">
                    <table className="min-w-full divide-y divide-gray-200">
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
                                <td colSpan={3} className="pt-4 text-right text-sm font-medium text-gray-500">Total Amount</td>
                                <td className="pt-4 text-right text-xl font-bold text-gray-900">${invoice.total_amount}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 flex justify-end">
                    <Link href="/invoices" className="text-indigo-600 hover:text-indigo-900 font-medium">
                        &larr; Back to Invoices
                    </Link>
                </div>
            </div>
        </div>
    );
}
