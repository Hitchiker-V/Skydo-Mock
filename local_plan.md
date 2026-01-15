# Local-First Development Plan for Skydo Replica

## 1. Overview

This plan outlines the development milestones for creating a functional, local-only replica of the Skydo platform. The primary goal is to build and test the complete end-to-end application logic without any reliance on external, third-party services like AWS, Stripe, or containerization platforms like Docker.

All external services will be simulated with mock implementations within the backend.

## 2. Core Features
The core features remain the same as the original plan:
- User Authentication
- Client & Invoice Management
- Payment Processing (via a mock service)
- Transaction Tracking
- Document Generation (FIRA & Invoices)
- User Dashboard

## 3. Local-Only Technology Stack

- **Frontend:** Next.js (React) with TypeScript & Tailwind CSS.
- **Backend:** Python with FastAPI.
- **Database:** PostgreSQL, running directly on the local machine.
- **Containerization:** **Omitted.** The frontend server, backend server, and database will run as standard processes on the development machine.
- **Cloud Provider:** **Omitted.** All development and testing will be done locally.
- **Payment Gateway:** **Mocked.** A mock Stripe service will be built into the FastAPI backend to simulate payment flows and webhooks.

## 4. Local Architecture

1.  The **Next.js frontend** will be served locally via `npm run dev`.
2.  The **FastAPI backend** will be served locally via `uvicorn`. It will connect to a locally running PostgreSQL instance.
3.  **Mock Stripe Service:** A special set of API endpoints will be created within the FastAPI application itself (e.g., under a `/mock/stripe` prefix). These endpoints will not connect to the internet; they will simulate Stripe's behavior by directly manipulating the local database. This service will be responsible for:
    -   Simulating the user onboarding flow.
    -   Generating fake payment pages/links.
    -   Providing endpoints to manually trigger a "payment success" or "payment failure" event for a specific invoice.
    -   Calling the application's internal webhook handler logic upon a triggered event, thus simulating a real webhook from an external service.

## 5. Development Milestones (Local-First)

### Milestone 1: Project Setup & User Authentication
- **Tasks:**
  1.  Create a project directory with two subdirectories: `frontend` and `backend`.
  2.  In `frontend`, set up the Next.js app. Run `npm install` to get dependencies.
  3.  In `backend`, set up the FastAPI app with a `requirements.txt` file. Run `pip install -r requirements.txt`.
  4.  Ensure PostgreSQL is installed and running locally. Create the initial database.
  5.  Define the `users` table schema (e.g., using SQLAlchemy models).
  6.  Implement backend APIs for user registration and login (issuing JWTs).
  7.  Create frontend pages for Register and Login that communicate with the backend.

### Milestone 2: Client & Invoice Management
- **Tasks:**
  1.  Define `clients` and `invoices` table schemas in the backend.
  2.  Create backend CRUD APIs for managing clients and invoices.
  3.  Build the frontend UI for users to list, add, and edit their clients and invoices.
  4.  Implement a service for generating a basic invoice PDF locally.

### Milestone 3: Mock Payment Provider & Onboarding
- **Tasks:**
  1.  In the backend, add a boolean field like `is_payment_enabled` to the `users` model.
  2.  Create a mock API endpoint, e.g., `POST /mock/stripe/onboard`, that sets the `is_payment_enabled` flag to `true` for the current user.
  3.  On the frontend, create a "Connect to Payments" button or page that, when clicked, calls this mock onboarding endpoint.
  4.  The UI should reflect the user's "onboarded" status.

### Milestone 4: End-to-End Mock Payment Flow
- **Tasks:**
  1.  Create a simple frontend page at a route like `/invoice/pay/[invoiceId]`. This page will display invoice details.
  2.  Instead of a real payment form, this page will have two buttons: **"Simulate Successful Payment"** and **"Simulate Failed Payment"**.
  3.  In the backend, create a new mock endpoint, e.g., `POST /mock/stripe/trigger-payment-status`. This endpoint will accept an `invoice_id` and a `status` (e.g., 'success' or 'failure').
  4.  This mock endpoint will then directly call the internal application logic that would normally be triggered by a real Stripe webhook. For a 'success' status, it will:
      -   Update the invoice's status to "Paid".
      -   Create an entry in the `transactions` table.
      -   Trigger the FIRA generation logic.
  5.  Connect the frontend buttons to call this mock trigger endpoint, thus completing the fully-local, end-to-end payment simulation.

### Milestone 5: Dashboard and Final Testing
- **Tasks:**
  1.  Develop the main user dashboard on the frontend to display data from the local database (total revenue, paid/unpaid invoices, recent transactions).
  2.  Refine the PDF generation for invoices and FIRA documents based on the mock transaction data.
  3.  Perform comprehensive end-to-end testing of the entire user journey, from registration to receiving a mock payment and seeing the dashboard update, all without a single external network call.
