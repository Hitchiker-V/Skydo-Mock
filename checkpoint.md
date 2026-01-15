# Checkpoint

This document tracks the overall progress of the Skydo Replica project. It is divided into two sections: work that has been completed and work that is remaining.

## 1. Work Done (Completed Tasks)

This section summarizes the planning and preparation phase of the project.

### 1.1. Initial Analysis and High-Level Planning
- ✅ Analyzed the features and services of the target website (skydo.com).
- ✅ Created an initial high-level development plan (`plan.md`).
- ✅ Modified `plan.md` to switch the backend technology from Node.js to Python/FastAPI based on user feedback.

### 1.2. Local-First Strategy and Constraint Definition
- ✅ Captured development environment constraints and prerequisites in `requirements.md`.
- ✅ Authored a comprehensive, local-only development plan (`local_plan.md`) to guide the project without external dependencies.

### 1.3. Detailed Module-by-Module Planning
- ✅ **Module 1: User Authentication**
  - Created `user_authentication.md` with a detailed development plan and a full suite of QA test cases.
- ✅ **Module 2: Client & Invoice Management**
  - Created `client_invoice_management.md` with a detailed development plan and QA test cases.
- ✅ **Module 3: Mock Payment Provider & Onboarding**
  - Created `mock_payment_provider_onboarding.md` with a detailed development plan and QA test cases.
- ✅ **Module 4: End-to-End Mock Payment Flow**
  - Created `end_to_end_mock_payment_flow.md` with a detailed development plan and QA test cases.

---

## 2. Work Left (Implementation & QA)

This section outlines the development work to be done, based on the approved module plans.

### 2.1. Module 1: Project Setup & User Authentication
- [ ] **Backend:**
  - [ ] Set up project structure and Python virtual environment.
  - [ ] Install all dependencies from `requirements.txt`.
  - [ ] Implement database connection, models (`User`), and schemas.
  - [ ] Implement password hashing and JWT security functions.
  - [ ] Implement API endpoints for `/auth/register`, `/auth/token`, and `/users/me`.
- [ ] **Frontend:**
  - [ ] Set up Next.js project with TypeScript and Tailwind CSS.
  - [ ] Create API service functions to communicate with the backend.
  - [ ] Build UI pages for `/register` and `/login`.
  - [ ] Implement protected routes and a `/dashboard` placeholder page.
- [ ] **QA:**
  - [ ] Execute all backend API and frontend E2E test cases from `user_authentication.md`.

### 2.2. Module 2: Client & Invoice Management
- [ ] **Backend:**
  - [ ] Implement `Client`, `Invoice`, and `InvoiceItem` database models.
  - [ ] Implement CRUD APIs for both clients and invoices, ensuring they are protected and user-specific.
- [ ] **Frontend:**
  - [ ] Build UI pages for creating, listing, editing, and deleting clients.
  - [ ] Build UI pages for creating and listing invoices, including a client selection dropdown.
  - [ ] Build a detail view page for a single invoice.
- [ ] **QA:**
  - [ ] Execute all test cases from `client_invoice_management.md`.

### 2.3. Module 3: Mock Payment Provider & Onboarding
- [ ] **Backend:**
  - [ ] Add `is_payment_onboarded` field to the `User` model.
  - [ ] Implement the `/mock/payments/onboard` API endpoint.
- [ ] **Frontend:**
  - [ ] Build the `/settings/payments` page with conditional UI based on the user's onboarding status.
  - [ ] Implement the logic to call the onboarding API.
- [ ] **QA:**
  - [ ] Execute all test cases from `mock_payment_provider_onboarding.md`.

### 2.4. Module 4: End-to-End Mock Payment Flow
- [ ] **Backend:**
  - [ ] Implement the `Transaction` model.
  - [ ] Add `payment_link_id` to the `Invoice` model and generate it upon creation.
  - [ ] Implement the internal fulfillment service.
  - [ ] Implement the public `/invoices/public/{payment_link_id}` endpoint.
  - [ ] Implement the `/mock/payments/trigger-payment` endpoint.
- [ ] **Frontend:**
  - [ ] Build the public `/pay/[paymentLinkId]` page with simulation buttons.
  - [ ] Update the authenticated invoice views to show the payment link and reflect status changes.
- [ ] **QA:**
  - [ ] Execute all test cases from `end_to_end_mock_payment_flow.md`.

### 2.5. Module 5: Dashboard and Final Touches
- [ ] **Backend:**
  - [ ] Implement PDF generation service for invoices and FIRA documents.
  - [ ] Create API endpoints for dashboard analytics.
- [ ] **Frontend:**
  - [ ] Develop the main user dashboard UI to display key metrics (revenue, invoice statuses, etc.).
- [ ] **QA:**
  - [ ] Perform full regression testing of the entire application flow.
