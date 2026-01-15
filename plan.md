# Plan to Replicate Skydo

## 1. Overview

Skydo is a platform designed for Indian freelancers and businesses to manage and receive international payments. It provides users with global bank accounts, low-cost currency conversion, and automated compliance documentation like FIRA and GST-compliant invoices.

This document outlines a detailed plan to create a functional replica of the Skydo platform.

## 2. Core Features to Replicate

- **User Authentication:** Secure registration and login for businesses/freelancers.
- **Client Management:** Ability for users to add, view, and manage their international clients.
- **Multi-Currency Accounts:** Integration with a service to provide users with virtual bank accounts in different currencies (e.g., USD, EUR, GBP).
- **Invoice Generation:** Create, manage, and send GST-compliant invoices to clients.
- **Payment Processing:** Receive international payments from clients.
- **Transaction Tracking:** Real-time tracking of payment status.
- **FIRA Generation:** Automated generation of Foreign Inward Remittance Advice (FIRA) documents for compliance.
- **Dashboard:** A central dashboard for users to view their account balances, recent transactions, and key metrics.

## 3. Proposed Technology Stack

- **Frontend:**
  - **Framework:** Next.js (React) with TypeScript for a modern, performant, and type-safe web application.
  - **Styling:** Tailwind CSS for a utility-first approach to building a custom and responsive design.
  - **State Management:** React Query for managing server state and caching, and Zustand or React Context for global UI state.

- **Backend:**
  - **Framework:** Python with FastAPI. This provides a modern, high-performance, and type-safe foundation for the API, leveraging Python's strong data science and web ecosystems. Pydantic is used for data validation.
  - **Authentication:** JWT (JSON Web Tokens) for stateless session management.

- **Database:**
  - **Type:** PostgreSQL. A powerful, open-source relational database well-suited for structured financial data.

- **Key Integrations:**
  - **Payment Provider:** **Stripe Connect** or **Wise Platform**. This is the most critical component. These platforms provide the necessary APIs for creating virtual bank accounts for users (customers), processing international payments, and handling currency conversion. This plan will assume the use of Stripe Connect.
  - **PDF Generation:** A library like `ReportLab` or a headless browser approach with Playwright to generate invoices and FIRA documents.

- **Deployment:**
  - **Containerization:** Docker & Docker Compose to create consistent development and production environments.
  - **Cloud Provider:** AWS (Amazon Web Services).
    - **Frontend:** Hosted on AWS S3 with CloudFront as the CDN.
    - **Backend:** Deployed as a container on AWS Fargate or ECS.
    - **Database:** AWS RDS for PostgreSQL.
    - **CI/CD:** GitHub Actions for automated testing and deployment.

## 4. High-Level Architecture

The system will be a classic single-page application (SPA) architecture:

1.  The **Next.js frontend** is the user's primary interaction point. It communicates with the backend via a RESTful API.
2.  The **Python/FastAPI backend** serves the API, handles all business logic (user management, invoice creation), and interacts with the database.
3.  All sensitive payment operations are delegated to the **Stripe API**. The backend will orchestrate the creation of Stripe connected accounts for users, initiate payment intents, and listen for webhooks to update transaction statuses.
4.  The **PostgreSQL database** stores data for users, clients, invoices, and transaction metadata. It does not store sensitive financial details like credit card numbers.
5.  **Webhooks** from Stripe will provide real-time updates on payment statuses (e.g., `payment_intent.succeeded`). The backend will have dedicated endpoints to receive these webhooks and update the database accordingly.

## 5. Development Milestones

### Milestone 1: Project Setup & User Authentication
- **Tasks:**
  1. Initialize a monorepo (e.g., using `npm` workspaces for the frontend and a standard Python structure for the backend) to house both the `frontend` and `backend` applications.
  2. Set up the Next.js frontend with TypeScript and Tailwind CSS.
  3. Set up the Python/FastAPI backend.
  4. Define the PostgreSQL schema for `users`.
  5. Implement backend APIs for user registration (email/password) and login (issuing JWTs).
  6. Create frontend pages for Register and Login, with forms that call the backend APIs.
  7. Implement protected routes that require a valid JWT.

### Milestone 2: Client & Invoice Management (No Payments)
- **Tasks:**
  1. Define database schemas for `clients` and `invoices`. A user can have many clients, and a client can have many invoices.
  2. Create backend CRUD (Create, Read, Update, Delete) APIs for managing clients.
  3. Create backend CRUD APIs for managing invoices.
  4. Build the frontend UI for users to list, add, and edit their clients.
  5. Build the frontend UI for users to create, view, and update invoices associated with a client.
  6. Implement PDF generation for a basic invoice.

### Milestone 3: Stripe Connect Integration & Account Onboarding
- **Tasks:**
  1. Sign up for a Stripe developer account and get API keys.
  2. Implement the Stripe Connect onboarding flow. This involves redirecting users from our platform to Stripe to complete a form and get an associated "Connected Account".
  3. Create a backend service to handle the OAuth-like redirect and store the `stripe_account_id` against the user in our database.
  4. Build a "Bank Accounts" or "Payouts" section in the frontend where users can initiate the Stripe onboarding process and see their status.

### Milestone 4: End-to-End Payment Flow
- **Tasks:**
  1. Modify the invoicing flow: when a user sends an invoice, generate a unique, hosted payment link using the Stripe API, associated with the user's connected account.
  2. Implement the backend webhook listener to securely receive events from Stripe (e.g., `checkout.session.completed`).
  3. When a payment is successful, update the `invoice` status in the database to "Paid".
  4. Create a `transactions` table in the database to log all payment activities.
  5. Build the frontend UI on the dashboard to show a list of transactions with real-time status updates.

### Milestone 5: Document Generation & Final Touches
- **Tasks:**
  1. Refine the PDF generation service to create GST-compliant invoices.
  2. Based on a successful transaction, generate a FIRA document in PDF format.
  3. Build out the user dashboard to provide a summary of total revenue, outstanding invoices, and recent transactions.
  4. Thoroughly test all user flows, from registration to receiving a payment and downloading compliance documents.

## 6. Next Steps

The next step is to begin **Milestone 1** by setting up the project structure and core authentication features.
