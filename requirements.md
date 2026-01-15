# Development Prerequisites for Skydo Replica

This document outlines the necessary prerequisites for successfully executing the development plan. Please review and update this file to reflect your current environment and skill set.

## 1. Software and Tools

These are the essential software applications and tools that need to be installed on your development machine.

-   **Version Control:**
    -   [x] Git (latest stable version)
-   **Frontend Development:**
    -   [x] Node.js (LTS version, e.g., 18.x or 20.x)
    -   [x] npm or Yarn (package manager for Node.js)
-   **Backend Development:**
    -   [x] Python (version 3.9+)
    -   [x] pip or Poetry/Rye (package manager for Python)
-   **Database:**
    -   [x] PostgreSQL (locally installed or accessible via Docker)
    -   [x] A PostgreSQL client (e.g., `psql`, DBeaver, PGAdmin)
-   **Containerization:**
    -   [No] Docker Desktop (includes Docker Engine and Docker Compose) - Create a mock, non contanerized version
-   **Code Editor/IDE:**
    -   [x] A robust IDE like VS Code, PyCharm, or WebStorm with relevant extensions (Python, TypeScript, React).

## 2. Accounts and Services

These accounts are required for integrating with third-party services and cloud infrastructure.

-   **Version Control Hosting:**
    -   [x] GitHub Account (or GitLab/Bitbucket) for repository hosting and CI/CD.
-   **Cloud Provider:**
    -   [No] AWS Account (with administrative access or necessary IAM roles for S3, CloudFront, Fargate/ECS, RDS) - use local mock environment (we will deploy later post tesing)
-   **Payment Gateway:**
    -   [No] Stripe Developer Account (for testing and live payment processing) - Create a mock flow and mock functionality

## 3. Knowledge and Skills

While not strictly "installable" prerequisites, a foundational understanding of these topics will significantly aid development.

-   **Frontend:**
    -   [x] Strong understanding of React and its ecosystem (hooks, context API).
    -   [x] Experience with Next.js features (routing, data fetching, API routes).
    -   [x] Proficiency in TypeScript.
    -   [x] Familiarity with Tailwind CSS.
-   **Backend:**
    -   [x] Strong understanding of Python.
    -   [x] Experience with FastAPI (dependency injection, Pydantic models).
    -   [x] Knowledge of ORMs (e.g., SQLAlchemy) for database interaction.
    -   [x] Understanding of JWT-based authentication.
    -   [x] RESTful API design principles.
-   **Database:**
    -   [x] Basic to intermediate SQL knowledge.
    -   [x] Database schema design principles.
-   **DevOps/Cloud:**
    -   [x] Basic understanding of Docker and containerization.
    -   [x] Familiarity with AWS services mentioned (S3, CloudFront, Fargate/ECS, RDS).
    -   [x] Concepts of CI/CD pipelines.
-   **General:**
    -   [x] Asynchronous programming concepts.
    -   [x] Web security best practices.
