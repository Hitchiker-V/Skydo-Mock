# Module Plan: Project Setup & User Authentication

This document outlines the development and testing plan for the first module: setting up the project structure and implementing end-to-end user authentication.

## 1. Development Plan

### 1.1. Project Structure
- Create a root directory for the project (e.g., `skydo-replica`).
- Inside the root, create two subdirectories:
  - `frontend`: For the Next.js application.
  - `backend`: For the FastAPI application.

### 1.2. Database Setup
- Install PostgreSQL on your local machine if not already present.
- Create a new database for this project, e.g., `skydo_local`.

### 1.3. Backend Development (FastAPI)
- **Environment:**
  - Inside the `backend` directory, create a Python virtual environment and activate it.
  - Create a `requirements.txt` file with the following dependencies:
    ```
    fastapi
    uvicorn[standard]
    sqlalchemy
    psycopg2-binary
    passlib[bcrypt]
    python-jose[cryptography]
    ```
  - Install the dependencies: `pip install -r requirements.txt`.

- **Application Structure:**
  - `main.py`: Main application file to initialize FastAPI and include routers.
  - `database.py`: SQLAlchemy setup (engine, SessionLocal, Base).
  - `models.py`: Define a `User` table model with columns for `id`, `email`, `hashed_password`, `is_active`.
  - `schemas.py`: Define Pydantic models for data validation and serialization (`UserCreate`, `User`, `Token`).
  - `security.py`: Helper functions for password hashing/verification and creating/decoding JWTs.
  - `crud.py`: Functions that interact with the database (e.g., `get_user_by_email`, `create_user`).
  - `routers/auth.py`: API router containing the authentication endpoints.

- **API Endpoints:**
  - `POST /auth/register`:
    - Accepts: `email` and `password`.
    - Logic: Hashes the password, creates a new user in the database via `crud.py`.
    - Returns: The newly created user's data (without the password).
  - `POST /auth/token`:
    - Accepts: `username` (email) and `password` in a form data payload.
    - Logic: Authenticates the user, and if successful, creates and returns a JWT access token.
  - `GET /users/me`:
    - Logic: A protected endpoint that requires a valid JWT. It decodes the token to identify the user and returns their information.

### 1.4. Frontend Development (Next.js)
- **Environment:**
  - Navigate to the `frontend` directory.
  - Initialize a new Next.js application with TypeScript and Tailwind CSS: `npx create-next-app@latest --ts --tailwind .`
  - Install `axios` for making API calls: `npm install axios`.

- **Application Structure:**
  - `services/api.ts`: A file to configure a central Axios instance and define API service functions (`register`, `login`, `getCurrentUser`).
  - `hooks/useAuth.ts`: A custom hook to manage authentication state, login, and logout logic throughout the application.
  - `components/`: Directory for reusable UI components (e.g., `Input.tsx`, `Button.tsx`).
  - `pages/`:
    - `register.tsx`: A page with a registration form (email, password, confirm password). On submit, it calls the `/auth/register` backend endpoint.
    - `login.tsx`: A page with a login form (email, password). On submit, it calls the `/auth/token` endpoint and stores the returned JWT securely (e.g., in an HttpOnly cookie or local storage).
    - `dashboard.tsx`: A protected page. It should use a wrapper or logic to check for a valid auth token. If the user is not authenticated, they should be redirected to `/login`.
    - `_app.tsx`: Wrap the application with an authentication provider/context to make auth state globally available.

## 2. QA & Test Cases

### Test Environment
- **Backend:** Running locally on `http://localhost:8000`.
- **Frontend:** Running locally on `http://localhost:3000`.
- **Database:** Local PostgreSQL instance `skydo_local` is running and has been reset (tables dropped) before starting the test suite.

### Backend API Test Cases (Manual API Client)

| Test ID          | Description                                    | Steps                                                                                             | Expected Result                                                                    |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **TC-AUTH-API-01** | Successful User Registration                   | `POST /auth/register` with `email: "test@example.com"`, `password: "password123"`                 | HTTP `200 OK`. Response body contains user object with email, id, is_active.        |
| **TC-AUTH-API-02** | Registration with Duplicate Email              | Repeat TC-AUTH-API-01.                                                                            | HTTP `400 Bad Request`. Response body contains a clear error message like "Email already registered". |
| **TC-AUTH-API-03** | Successful Login                               | `POST /auth/token` with form data `username: "test@example.com"`, `password: "password123"`       | HTTP `200 OK`. Response body contains `access_token` and `token_type: "bearer"`.    |
| **TC-AUTH-API-04** | Login with Incorrect Password                  | `POST /auth/token` with form data `username: "test@example.com"`, `password: "wrongpassword"`     | HTTP `401 Unauthorized`.                                                          |
| **TC-AUTH-API-05** | Login with Non-existent User                   | `POST /auth/token` with form data `username: "nouser@example.com"`, `password: "password123"`    | HTTP `401 Unauthorized`.                                                          |
| **TC-AUTH-API-06** | Access Protected Route (Success)               | `GET /users/me` with `Authorization: Bearer <valid_token_from_TC-AUTH-API-03>` header.           | HTTP `200 OK`. Response body contains the user's data.                             |
| **TC-AUTH-API-07** | Access Protected Route (No Token)              | `GET /users/me` with no `Authorization` header.                                                   | HTTP `401 Unauthorized`.                                                          |
| **TC-AUTH-API-08** | Access Protected Route (Invalid/Expired Token) | `GET /users/me` with `Authorization: Bearer <invalid_token>` header.                              | HTTP `401 Unauthorized`.                                                          |

### Frontend End-to-End Test Cases (Manual Browser)

| Test ID          | Description                               | Steps                                                                                                                              | Expected Result                                                                                                  |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **TC-AUTH-E2E-01** | Successful Registration                 | 1. Navigate to `/register`. <br> 2. Fill in `email`, `password`, and `confirm password`. <br> 3. Click "Register".                      | User is redirected to `/login` and a "Registration successful" message is shown.                                |
| **TC-AUTH-E2E-02** | Registration with Mismatched Passwords  | 1. Navigate to `/register`. <br> 2. Fill in password and a different confirm password.                                               | A client-side validation error "Passwords do not match" is shown. The form is not submitted.                     |
| **TC-AUTH-E2E-03** | Registration with Existing Email        | 1. Attempt to register with the same email from TC-AUTH-E2E-01.                                                                    | An error message "Email already registered" is displayed on the page.                                            |
| **TC-AUTH-E2E-04** | Successful Login                        | 1. Navigate to `/login`. <br> 2. Enter credentials for the user created in TC-AUTH-E2E-01. <br> 3. Click "Login".                       | User is redirected to the `/dashboard` page.                                                                     |
| **TC-AUTH-E2E-05** | Login with Invalid Credentials          | 1. Navigate to `/login`. <br> 2. Enter a valid email but an incorrect password. <br> 3. Click "Login".                                | An error message "Incorrect email or password" is displayed.                                                     |
| **TC-AUTH-E2E-06** | Unauthorized Access to Protected Route  | 1. Clear all session/local storage. <br> 2. Manually navigate to the `/dashboard` URL.                                              | User is immediately redirected to `/login`.                                                                      |
| **TC-AUTH-E2E-07** | Successful Logout                       | 1. Log in successfully. <br> 2. On the dashboard, click the "Logout" button.                                                      | User is redirected to the `/login` page. The session/token is cleared.                                           |
| **TC-AUTH-E2E-08** | Persisted Login Session                 | 1. Log in successfully. <br> 2. Refresh the `/dashboard` page.                                                                     | The user remains logged in and stays on the `/dashboard` page.                                                   |
