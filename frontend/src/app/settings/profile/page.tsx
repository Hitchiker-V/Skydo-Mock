"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, updateUserProfile } from '@/services/api';

export default function ProfileSettingsPage() {
    const [businessName, setBusinessName] = useState('');
    const [gstin, setGstin] = useState('');
    const [businessAddress, setBusinessAddress] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await getMe();
                const user = response.data;
                setBusinessName(user.business_name || '');
                setGstin(user.gstin || '');
                setBusinessAddress(user.business_address || '');
            } catch (error) {
                console.error('Failed to fetch user profile', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateUserProfile({
                business_name: businessName,
                gstin: gstin,
                business_address: businessAddress
            });
            alert('Profile updated successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Failed to update profile', error);
            alert('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-black">Business Profile Settings</h1>
                    <button onClick={() => router.back()} className="text-sm text-indigo-600 hover:text-indigo-900">
                        &larr; Back
                    </button>
                </div>
                <p className="text-gray-600 mb-8">
                    Update your business details to ensure your invoices are GST-compliant and professional.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Legal Business Name</label>
                        <input
                            type="text"
                            required
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="e.g. Acme Services Pvt Ltd"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">GSTIN</label>
                        <input
                            type="text"
                            required
                            value={gstin}
                            onChange={(e) => setGstin(e.target.value)}
                            placeholder="e.g. 27AAAAA0000A1Z5"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                        <p className="mt-1 text-xs text-gray-500">Required for GST-compliant export invoices.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Registered Business Address</label>
                        <textarea
                            required
                            rows={3}
                            value={businessAddress}
                            onChange={(e) => setBusinessAddress(e.target.value)}
                            placeholder="Full address including city, state, and pincode"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
