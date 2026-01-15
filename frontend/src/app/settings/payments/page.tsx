"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { onboardToMockPayments } from '@/services/api';

interface User {
    email: string;
    is_payment_onboarded: boolean;
}

export default function PaymentSettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboarding, setOnboarding] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                router.push('/login');
                return;
            }
            const response = await api.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(response.data);
        } catch (error) {
            console.error('Failed to fetch user', error);
            router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleOnboard = async () => {
        setOnboarding(true);
        try {
            await onboardToMockPayments();
            await fetchUser(); // Refresh user state
        } catch (error) {
            console.error('Failed to onboard', error);
            alert('Failed to connect payment account. Please try again.');
        } finally {
            setOnboarding(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">Manage your payment provider connection.</p>
                </div>

                <div className="p-6">
                    {user.is_payment_onboarded ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Payment Account Connected</h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>Your account is successfully connected to the mock payment provider. You can now receive payments.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No Payment Account Connected</h3>
                            <p className="mt-1 text-sm text-gray-500">Connect your account to start receiving international payments.</p>
                            <div className="mt-6">
                                <button
                                    onClick={handleOnboard}
                                    disabled={onboarding}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {onboarding ? 'Connecting...' : 'Enable Mock Payments'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
