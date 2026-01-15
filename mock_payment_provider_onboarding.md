# Module Plan: Mock Payment Provider & Onboarding

This document provides the development and testing plan for the third module: simulating the user onboarding process for a mock payment provider. This builds upon the user authentication and client management modules.

## 1. Development Plan

The goal is to create a "switch" for each user that represents their connection to a payment system, without any actual external integration.

### 1.1. Backend Development (FastAPI)

- **Database Models (`models.py`):**
  - Add a new boolean field to the `User` model:
    ```python
    is_payment_onboarded = Column(Boolean, default=False, nullable=False)
    ```
  - This flag will track if a user has completed the mock onboarding process.

- **Pydantic Schemas (`schemas.py`):**
  - Update the `User` schema to include the new `is_payment_onboarded` field so it's exposed via the API.

- **CRUD Logic (`crud.py`):**
  - Create a new function, `set_user_onboarding_status`, that takes a `user_id` and a boolean `status`, and updates the corresponding user in the database.

- **API Routers:**
  - Create a new router file: `routers/mock_payments.py`.
  - Add this router to the main `main.py` application.
  - Create a new endpoint within `routers/mock_payments.py`:
    - **`POST /mock/payments/onboard`**:
      - **Protection:** This endpoint must be protected, requiring a logged-in user.
      - **Logic:** It gets the current authenticated user, calls the `set_user_onboarding_status` CRUD function to set their `is_payment_onboarded` flag to `True`, and commits the change.
      - **Returns:** A success message or the updated user object.
  - **Modify Existing Router (`routers/auth.py`):**
    - Ensure the `GET /users/me` endpoint returns the full user object, including the new `is_payment_onboarded` status, so the frontend can easily check it.

### 1.2. Frontend Development (Next.js)

- **API Services (`services/api.ts`):**
  - Create a new function `onboardToMockPayments()` which sends an authorized `POST` request to the `/mock/payments/onboard` endpoint.

- **Authentication Hook/Context (`hooks/useAuth.ts` or similar):**
  - The user object fetched and stored by the hook must now include the `is_payment_onboarded` property.
  - Expose this property and a function to refresh the user data from the `useAuth` hook.

- **New Settings Page:**
  - Create a new settings page at the route **`/settings/payments`**.
  - This page will be the main UI for this module. It will fetch the current user's state from the `useAuth` hook and render conditionally:
    - **Condition: `user.is_payment_onboarded` is `false`**
      - Display a clear message, e.g., "Connect your account to start receiving payments."
      - Show a button with text like "Enable Mock Payments".
      - On click, this button will call the `onboardToMockPayments()` API service function. It should show a loading state during the API call.
    - **Condition: `user.is_payment_onboarded` is `true`**
      - Display a confirmation message, e.g., "Payment account connected successfully."
      - Show a visual indicator of the "connected" status (e.g., a green checkmark).

## 2. QA & Test Cases

### Test Environment
- A user is registered and logged in.
- The user's initial state in the database is `is_payment_onboarded: false`.
- Backend and Frontend servers are running.

### Backend API Test Cases

| Test ID           | Description                          | Steps                                                                      | Expected Result                                                                    |
| ----------------- | ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **TC-MOCK-API-01**| Get Initial User Status                | `GET /users/me` with the logged-in user's auth header.                     | HTTP `200 OK`. The response body contains `is_payment_onboarded: false`.            |
| **TC-MOCK-API-02**| Onboard User (Success)                 | `POST /mock/payments/onboard` with the auth header.                        | HTTP `200 OK`. Response contains a success message or the updated user object.     |
| **TC-MOCK-API-03**| Verify Onboarded Status via API        | After TC-MOCK-API-02, call `GET /users/me` again with the same auth header.  | HTTP `200 OK`. The response body now contains `is_payment_onboarded: true`.         |
| **TC-MOCK-API-04**| Onboarding Attempt (No Auth)           | `POST /mock/payments/onboard` with no `Authorization` header.              | HTTP `401 Unauthorized`.                                                          |

### Frontend End-to-End Test Cases

| Test ID          | Description                          | Steps                                                                                                                                  | Expected Result                                                                                                          |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **TC-MOCK-E2E-01** | View Initial Onboarding State        | 1. Log in as a user who has not been onboarded. <br> 2. Navigate to `/settings/payments`.                                             | The page displays a message to connect and shows the "Enable Mock Payments" button.                                      |
| **TC-MOCK-E2E-02** | Perform Onboarding Action            | 1. While on the `/settings/payments` page, click the "Enable Mock Payments" button.                                                    | A loading indicator should appear briefly. After it disappears, the page content should change.                        |
| **TC-MOCK-E2E-03** | Verify UI Change After Onboarding    | After the action in TC-MOCK-E2E-02, observe the `/settings/payments` page.                                                             | The page now displays the "Payment account connected" message and/or a success indicator. The "Enable" button is gone.   |
| **TC-MOCK-E2E-04** | Verify State Persistence             | 1. After successfully onboarding, manually refresh the page. <br> 2. Log out and log back in, then navigate to `/settings/payments`. | In both cases, the page should consistently show the "connected" state, proving the change was saved in the database. |
