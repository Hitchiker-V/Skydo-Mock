import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

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

export const triggerMockPayment = async (paymentLinkId: string, status: string) => {
  return api.post('/mock/payments/trigger-payment', { payment_link_id: paymentLinkId, status });
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
