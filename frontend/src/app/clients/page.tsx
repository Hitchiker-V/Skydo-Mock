"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClients, deleteClient } from '@/services/api';
import Link from 'next/link';

interface Client {
    id: number;
    name: string;
    email: string;
    address: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await getClients();
            setClients(response.data);
        } catch (error) {
            console.error('Failed to fetch clients', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this client?')) {
            try {
                await deleteClient(id);
                fetchClients();
            } catch (error) {
                console.error('Failed to delete client', error);
            }
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                    <Link href="/clients/new" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        New Client
                    </Link>
                </div>

                {clients.length === 0 ? (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
                        No clients found. Create one to get started.
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clients.map((client) => (
                                    <tr key={client.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.address}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/clients/${client.id}/edit`} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</Link>
                                            <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
