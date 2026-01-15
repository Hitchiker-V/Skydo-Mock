import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMe = async () => {
  const token = localStorage.getItem('token');
  return api.get('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getClients = async () => {
  const token = localStorage.getItem('token');
  return api.get('/clients/', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createClient = async (data: any) => {
  const token = localStorage.getItem('token');
  return api.post('/clients/', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateClient = async (id: number, data: any) => {
  const token = localStorage.getItem('token');
  return api.put(`/clients/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const deleteClient = async (id: number) => {
  const token = localStorage.getItem('token');
  return api.delete(`/clients/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getInvoices = async () => {
  const token = localStorage.getItem('token');
  return api.get('/invoices/', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const createInvoice = async (data: any) => {
  const token = localStorage.getItem('token');
  return api.post('/invoices/', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getInvoice = async (id: number) => {
  const token = localStorage.getItem('token');
  return api.get(`/invoices/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const onboardToMockPayments = async () => {
  const token = localStorage.getItem('token');
  return api.post('/mock/payments/onboard', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getPublicInvoice = async (paymentLinkId: string) => {
  return api.get(`/invoices/public/${paymentLinkId}`);
};

export const triggerMockPayment = async (paymentLinkId: string, status: string, senderName?: string) => {
  return api.post('/mock/payments/trigger-payment', { payment_link_id: paymentLinkId, status, sender_name: senderName });
};

export const getDashboardData = async () => {
  const token = localStorage.getItem('token');
  return api.get('/analytics/dashboard', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const downloadInvoicePDF = async (invoiceId: number) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:8000/documents/invoices/${invoiceId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Download failed');
  return response.blob();
};

export const downloadFiraPDF = async (invoiceId: number) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:8000/documents/invoices/${invoiceId}/fira`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Download failed');
  return response.blob();
};

export const getMyVirtualAccounts = async () => {
  const token = localStorage.getItem('token');
  return api.get('/users/me/virtual-accounts', {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const getInvoiceTransaction = async (invoiceId: number) => {
  const token = localStorage.getItem('token');
  return api.get(`/invoices/${invoiceId}/transaction`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const processSettlements = async () => {
  const token = localStorage.getItem('token');
  return api.post('/mock/payments/process-settlements', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const requestVirtualAccount = async (currency: string) => {
  const token = localStorage.getItem('token');
  return api.post('/users/me/virtual-accounts', { currency }, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const updateUserProfile = async (profile: { business_name: string; gstin: string; business_address: string }) => {
  const token = localStorage.getItem('token');
  return api.put('/users/me/profile', profile, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export default api;
