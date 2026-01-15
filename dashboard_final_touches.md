# Module Plan: Dashboard & Final Touches

This document outlines the plan for Module 5, focusing on comprehensive analytics, PDF document generation, and UI polish.

## 1. Requirements

### 1.1. Dashboard Analytics
- **Total Revenue:** Sum of all 'paid' invoices.
- **Outstanding Amount:** Sum of all 'draft' or 'sent' (unpaid) invoices.
- **DSO (Days Sales Outstanding):** Average time taken to collect payments.
- **Monthly Growth:** Revenue vs Previous Month.
- **Client-wise Breakdown:** Revenue per client.

### 1.2. Document Generation
- **Invoice PDF:** Professional PDF representation of the invoice.
- **FIRA (Foreign Inward Remittance Advice):** A document certifying the receipt of foreign funds (available only for paid invoices).

## 2. Development Plan

### 2.1. Backend (FastAPI)

- **Dependencies:**
  - Install `reportlab` for PDF generation.

- **New Service: `services/analytics.py`**
  - `get_kpis(user_id)`: Calculates Total Revenue, Outstanding, DSO.
  - `get_monthly_revenue(user_id)`: Aggregates revenue by month.
  - `get_client_revenue(user_id)`: Aggregates revenue by client.

- **New Service: `services/pdf_generator.py`**
  - `generate_invoice_pdf(invoice)`: Returns PDF bytes.
  - `generate_fira_pdf(invoice, transaction)`: Returns PDF bytes.

- **New Router: `routers/analytics.py`**
  - `GET /analytics/dashboard`: Returns all dashboard metrics.

- **New Router: `routers/documents.py`**
  - `GET /documents/invoices/{id}/download`: Downloads Invoice PDF.
  - `GET /documents/invoices/{id}/fira`: Downloads FIRA PDF (requires 'paid' status).

### 2.2. Frontend (Next.js)

- **Dashboard Page (`/dashboard`)**
  - **Stats Cards:** Display KPI numbers.
  - **Charts:** Use `recharts` (or similar) for Monthly Growth and Client Breakdown.
  - **Recent Transactions:** Table showing last 5 paid invoices.

- **Invoice Detail Page (`/invoices/[id]`)**
  - Add "Download PDF" button.
  - Add "Download FIRA" button (conditionally rendered if status is 'paid').

## 3. QA & Test Cases

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|-----------------|
| **TC-DASH-01** | Verify KPIs | Create invoices with known amounts (paid & unpaid). Check Dashboard. | Total Revenue and Outstanding match the sum of invoices. |
| **TC-DASH-02** | Verify Charts | Check Client Breakdown chart. | Proportions match the revenue per client. |
| **TC-DOC-01** | Download Invoice PDF | Click "Download PDF" on an invoice. | A valid PDF file is downloaded containing correct invoice details. |
| **TC-DOC-02** | Download FIRA | Click "Download FIRA" on a paid invoice. | A valid PDF file is downloaded. |
| **TC-DOC-03** | FIRA Unavailable for Unpaid | Check an unpaid invoice. | "Download FIRA" button is disabled or hidden. |
