# Week 9 & 10: Technical Deep Dive & Implementation
## Project: backend-app (Refined with PDF Insights)

---

## 📅 Week 9: Testing & Error Handling

### 1. Unit Testing (Jest)
*   **Focus**: Isolated testing of business logic and controllers.
*   **Example**: `ProductController.test.ts`
*   **Implementation**:
    *   Mocking dependencies using `jest.fn()` to ensure fast, isolated tests.
    *   **Practical**: Testing that `register` returns 201 and `login` returns tokens.

### 2. Integration Testing & Mocking
*   **Focus**: Verifying interactions between layers (API -> UseCase -> DB).
*   **New**: `user_auth.integration.test.ts`
*   **Implementation**:
    *   Using `supertest` to hit real endpoints.
    *   **Mocking**: In-memory MongoDB (`mongodb-memory-server`) instead of real DB to ensure a clean state for every test run.

### 3. Centralized Error Management
*   **Pattern**: Unified `errorHandler` middleware in `middleware.ts`.
*   **Consistency**: Maps domain-specific exceptions to HTTP codes.
    *   `BadRequestError` (400): Used for validation failures or invalid login.
    *   `NotFoundError` (404): Used when a specific resource ID doesn't exist.
*   **Benefit**: Prevents sensitive stack traces from leaking to the client in production.

---

## 📅 Week 10: Caching, Scaling & Deployment

### 1. High-Performance Caching (Redis)
*   **Concepts from PDF**:
    *   **In-Memory**: Used for rate limiting in `rate_limitor.ts` (volatile, local to instance).
    *   **Distributed (Redis)**: `imageQueue.ts` using `Bull`. 
    *   **Cache-Aside Pattern**: (Concept) Check Redis -> Return if Hit -> Query DB if Miss -> Store in Redis with TTL.
*   **Why Redis?** Enables data sharing across horizontally scaled instances.

### 2. Scaling & Load Balancing
*   **Horizontal Scaling**: Adding more instances as seen in `render.yaml` (`numInstances: 2`).
*   **Load Balancer (Nginx)**: 
    *   Acts as a reverse proxy (`nginx.conf`).
    *   Distributes traffic to the `api` service pool.
    *   Provides redundancy: if one API instance fails, others pick up the load.

### 3. Production Configuration
*   **Environment**: `.env` management and `NODE_ENV=production` optimizations.
*   **Graceful Shutdown**: (Implementation Detail) 
    *   Handling `SIGTERM` and `SIGINT` to close DB connections and finish pending requests before exiting.
    *   Essential for zero-downtime deployments.

### 4. CI/CD & Docker
*   **Containerization**: `Dockerfile` ensures "works on my machine" translates to production.
*   **Automation**: `.github/workflows/ci.yml` runs tests on every push.
*   **Deployment**: Automated builds and deployments via **Render** using the `render.yaml` blueprint.
