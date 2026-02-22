"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDashboardData, getMyVirtualAccounts, processSettlements, requestVirtualAccount } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface VirtualAccount {
  id: number;
  currency: string;
  bank_name: string;
  account_number: string;
  routing_code: string;
  provider: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [settling, setSettling] = useState(false);
  const [requestingVA, setRequestingVA] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      const [dashboardResponse, vaResponse] = await Promise.all([
        getDashboardData(),
        getMyVirtualAccounts()
      ]);
      setData(dashboardResponse.data);
      setVirtualAccounts(vaResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleProcessSettlements = async () => {
    setSettling(true);
    try {
      await processSettlements();
      alert('Local payouts processed successfully! Funds are now SETTLED.');
      await fetchData();
    } catch (error) {
      console.error('Settlement failed', error);
      alert('Failed to process settlements');
    } finally {
      setSettling(false);
    }
  };

  const handleRequestVA = async (currency: string) => {
    setRequestingVA(currency);
    try {
      await requestVirtualAccount(currency);
      alert(`Successfully provisioned your ${currency} Virtual Account!`);
      await fetchData();
    } catch (error) {
      console.error('Failed to request VA', error);
      alert('Failed to provision Virtual Account');
    } finally {
      setRequestingVA(null);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!data) return <div className="p-8">Failed to load data</div>;

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const availableCurrencies = ['USD', 'EUR', 'GBP'].filter(
    curr => !virtualAccounts.some(va => va.currency === curr)
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

            {/* Settlement Banner */}
            {data.kpis.pending_settlements_count > 0 && (
              <div className="mt-8 bg-indigo-600 rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🏦</span>
                    <div>
                      <h3 className="text-white font-bold">Pending Local Payouts</h3>
                      <p className="text-indigo-100 text-sm">
                        You have {data.kpis.pending_settlements_count} transaction(s) ready for local settlement.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleProcessSettlements}
                    disabled={settling}
                    className="bg-white text-indigo-600 px-4 py-2 rounded-md font-bold hover:bg-indigo-50 transition disabled:opacity-50"
                  >
                    {settling ? 'Processing...' : 'Process Payouts Now'}
                  </button>
                </div>
              </div>
            )}

            {/* Virtual Accounts Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Your Virtual Accounts</h2>
                <div className="flex space-x-2">
                  {availableCurrencies.map(curr => (
                    <button
                      key={curr}
                      onClick={() => handleRequestVA(curr)}
                      disabled={!!requestingVA}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 disabled:opacity-50"
                    >
                      {requestingVA === curr ? `Opening ${curr}...` : `+ Open ${curr} Account`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {virtualAccounts.map((va) => (

                  <div key={va.id} className="bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden shadow-lg rounded-lg text-white">
                    <div className="px-4 py-5 sm:p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-lg font-bold">{va.currency} Account</span>
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">{va.provider}</span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-white/70">Bank</p>
                          <p className="text-sm font-medium">{va.bank_name}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-white/70">Account Number</p>
                            <p className="text-sm font-mono">{va.account_number}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(va.account_number, `acc-${va.id}`)}
                            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
                          >
                            {copied === `acc-${va.id}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-white/70">Routing Code</p>
                            <p className="text-sm font-mono">{va.routing_code}</p>
                          </div>
                          <button
                            onClick={() => copyToClipboard(va.routing_code, `route-${va.id}`)}
                            className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition"
                          >
                            {copied === `route-${va.id}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            {/* Stats Cards */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">${data.kpis.total_revenue.toFixed(2)}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Outstanding Amount</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">${data.kpis.outstanding_amount.toFixed(2)}</dd>
                </div>
              </div>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">{data.kpis.total_invoices}</dd>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Monthly Revenue */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Revenue</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.monthly_revenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#4F46E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Client Breakdown */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Revenue by Client</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.client_revenue}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.client_revenue.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Clients</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Manage your international clients.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/clients" className="text-indigo-600 hover:text-indigo-900 font-medium">
                      View Clients &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Invoices</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Create and manage your invoices.</p>
                  </div>
                  <div className="mt-5">
                    <Link href="/invoices" className="text-indigo-600 hover:text-indigo-900 font-medium">
                      View Invoices &rarr;
                    </Link>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Settings</h3>
                  <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Configure your business profile and payment settings.</p>
                  </div>
                  <div className="mt-5 flex flex-col space-y-2">
                    <Link href="/settings/profile" className="text-indigo-600 hover:text-indigo-900 font-medium">
                      Business Profile &rarr;
                    </Link>
                    <Link href="/settings/payments" className="text-indigo-600 hover:text-indigo-900 font-medium">
                      Payment Provider &rarr;
                    </Link>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
