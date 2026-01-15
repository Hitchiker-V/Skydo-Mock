# Module Plan: Client & Invoice Management

This document outlines the development and testing plan for the second module: creating, managing, and viewing clients and invoices. This plan assumes the "User Authentication" module is complete and functional.

## 1. Development Plan

### 1.1. Backend Development (FastAPI)

- **Database Models (`models.py`):**
  - **`Client` model:**
    - `id` (Integer, Primary Key)
    - `name` (String)
    - `email` (String)
    - `address` (Text)
    - `owner_id` (Integer, ForeignKey to `users.id`)
    - Relationship to `User` model.
  - **`Invoice` model:**
    - `id` (Integer, Primary Key)
    - `status` (String, e.g., "draft", "sent", "paid") - Default: "draft"
    - `due_date` (Date)
    - `total_amount` (Numeric) - This will be calculated from items.
    - `client_id` (Integer, ForeignKey to `clients.id`)
    - `owner_id` (Integer, ForeignKey to `users.id`)
    - Relationships to `Client` and `InvoiceItem` models.
  - **`InvoiceItem` model:**
    - `id` (Integer, Primary Key)
    - `description` (String)
    - `quantity` (Integer)
    - `unit_price` (Numeric)
    - `invoice_id` (Integer, ForeignKey to `invoices.id`)

- **Pydantic Schemas (`schemas.py`):**
  - `ClientCreate`, `Client`: For creating and returning client data.
  - `InvoiceItemCreate`, `InvoiceItem`: For invoice line items.
  - `InvoiceCreate`: To create an invoice, accepting client_id, due_date, and a list of `InvoiceItemCreate`.
  - `Invoice`: To return full invoice data, including nested client and item details.

- **CRUD Logic (`crud.py`):**
  - Implement functions for clients: `create_client`, `get_client`, `get_clients_by_owner`, `update_client`, `delete_client`. **All queries must be filtered by `owner_id`**.
  - Implement functions for invoices: `create_invoice`, `get_invoice`, `get_invoices_by_owner`.

- **API Routers:**
  - Create a new router file `routers/clients.py`.
    - `POST /clients/`: Create a client for the logged-in user.
    - `GET /clients/`: List all clients for the logged-in user.
    - `GET /clients/{client_id}`: Get a single client, ensuring it belongs to the logged-in user.
    - `PUT /clients/{client_id}`: Update a client.
    - `DELETE /clients/{client_id}`: Delete a client.
  - Create a new router file `routers/invoices.py`.
    - `POST /invoices/`: Create an invoice.
    - `GET /invoices/`: List all invoices for the logged-in user.
    - `GET /invoices/{invoice_id}`: Get a single invoice.
  - Protect all endpoints; they must depend on a valid JWT to identify the `owner_id`.

### 1.2. Frontend Development (Next.js)

- **API Services (`services/api.ts`):**
  - Add functions to call all the new client and invoice endpoints, ensuring the auth token is included in the headers.

- **State Management (Optional but Recommended):**
  - Use a library like `SWR` or `React Query` to handle fetching, caching, and re-validating client and invoice data.

- **Client Management Pages:**
  - **`/clients`:**
    - Fetches and displays a list of the user's clients.
    - Shows an empty state message if no clients exist.
    - Contains a link/button to `/clients/new`.
    - Each client in the list has "Edit" and "Delete" buttons.
  - **`/clients/new`:**
    - A form to create a new client (name, email, address).
    - On successful creation, redirects to `/clients`.
  - **`/clients/[id]/edit`:**
    - A form pre-populated with data for a specific client.
    - On successful update, redirects to `/clients`.

- **Invoice Management Pages:**
  - **`/invoices`:**
    - Fetches and displays a list of invoices (showing client name, total amount, status, due date).
    - Contains a link/button to `/invoices/new`.
  - **`/invoices/new`:**
    - A multi-step form to create an invoice.
    - Step 1: Select a client from a dropdown (fetched from `/clients` API).
    - Step 2: Add invoice line items dynamically (description, quantity, unit price).
    - The form should calculate the total in real-time.
    - On submit, redirects to `/invoices`.
  - **`/invoices/[id]`:**
    - A detailed view of a single invoice, showing all its items and client information.

## 2. QA & Test Cases

### Test Environment
- User is logged in. Backend and Frontend servers are running. Database is clean.

### Backend API Test Cases

| Test ID           | Description                           | Steps                                                                                                  | Expected Result                                                                   |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **TC-CLIENT-API-01**| Create Client (Success)                 | `POST /clients` with valid data and auth header.                                                       | HTTP `200 OK`. Response contains the new client's data. DB confirms creation.    |
| **TC-CLIENT-API-02**| Get All Clients (Success)               | `GET /clients` with auth header.                                                                       | HTTP `200 OK`. Response is a list containing the client from the previous test.  |
| **TC-CLIENT-API-03**| Access Denial (Another User's Client) | 1. Create User A and User B. <br> 2. User A creates Client C. <br> 3. As User B, `GET /clients/{C.id}`. | HTTP `404 Not Found`.                                                             |
| **TC-INV-API-01**   | Create Invoice (Success)                | `POST /invoices` with a valid `client_id` (belonging to the user) and line items.                      | HTTP `200 OK`. Response contains the full invoice data.                           |
| **TC-INV-API-02**   | Create Invoice (Invalid Client)         | `POST /invoices` with a `client_id` that does not belong to the user.                                  | HTTP `404 Not Found` (or `400 Bad Request` depending on implementation).          |
| **TC-INV-API-03**   | Get All Invoices (Success)              | `GET /invoices` with auth header.                                                                      | HTTP `200 OK`. Response is a list containing the invoice from TC-INV-API-01.      |

### Frontend End-to-End Test Cases

| Test ID          | Description                        | Steps                                                                                                                                                             | Expected Result                                                                                                |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **TC-CLIENT-E2E-01** | Create Client (Success)              | 1. Log in. <br> 2. Navigate to `/clients`. <br> 3. Click "New Client". <br> 4. Fill form and save.                                                                 | Redirected to `/clients`. The new client is visible in the list.                                               |
| **TC-CLIENT-E2E-02** | Edit Client (Success)                | 1. On the `/clients` page, click "Edit" on a client. <br> 2. Change the client's name and save.                                                                    | Redirected to `/clients`. The list shows the updated client name.                                              |
| **TC-CLIENT-E2E-03** | Delete Client (Success)              | 1. On the `/clients` page, click "Delete" on a client. <br> 2. Confirm deletion in the prompt.                                                                     | The client is removed from the list.                                                                           |
| **TC-INV-E2E-01**  | Create Invoice (View)                | 1. Log in, ensure at least one client exists. <br> 2. Navigate to `/invoices`. <br> 3. Click "New Invoice".                                                           | The user is on the `/invoices/new` page. The client dropdown is populated with the user's clients.             |
| **TC-INV-E2E-02**  | Create Invoice (Success)             | 1. On the new invoice page, select a client. <br> 2. Add at least two line items. <br> 3. Set a due date. <br> 4. Save the invoice.                                     | Redirected to `/invoices`. The new invoice is in the list with status "draft" and the correct total amount.    |
| **TC-INV-E2E-03**  | View Invoice Details               | 1. From the `/invoices` list, click on the invoice created in the previous test.                                                                                  | The user is on the `/invoices/[id]` page. All invoice details, including line items and client info, are correct. |
