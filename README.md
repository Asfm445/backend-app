# Backend App - GraphQL API

This project provides a GraphQL-based backend using **Apollo Server 5** and **Express 5**.

## Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB running on `mongodb://localhost:27017/userdb`

### Installation
```bash
npm install
```

### Running the Server
```bash
npm run dev
```
The server will be available at: `http://localhost:4000`

## Interactive API Documentation

### REST API (Swagger)
Access the interactive Swagger documentation for REST endpoints:
👉 [http://localhost:4000/api-docs](http://localhost:4000/api-docs)

### GraphQL API (Apollo Sandbox)
Access the Apollo Sandbox to explore and test GraphQL queries/mutations:
👉 [http://localhost:4000/graphql](http://localhost:4000/graphql)

## Terminal Quick Start (curl)

### 1. Register User (REST)
```bash
curl -X POST http://localhost:4000/register \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com", "password": "password123"}'
```

### 2. Register User (GraphQL)
```bash
curl -X POST http://localhost:4000/graphql \
     -H "Content-Type: application/json" \
     -d '{"query": "mutation { register(name: \"John Doe\", email: \"john@example.com\", password: \"password123\") }"}'
```

### 3. Login (REST)
```bash
curl -X POST http://localhost:4000/login \
     -H "Content-Type: application/json" \
     -d '{"email": "john@example.com", "password": "password123"}'
```

### 4. Authenticated Request (GraphQL)
Once you have the `accessToken` from login, use it in the `Authorization` header:
```bash
curl -X POST http://localhost:4000/graphql \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
     -d '{"query": "query { me { email name root } }"}'
```

### 5. Authenticated Request (REST)
If a REST route requires authentication:
```bash
curl -X GET http://localhost:4000/protected-route \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## API Reference (GraphQL)

### Queries

#### 1. `health`
Returns the status of the API.
- **Query:**
  ```graphql
  query {
    health {
      status
    }
  }
  ```
- **Response:**
  ```json
  {
    "data": {
      "health": {
        "status": "ok"
      }
    }
  }
  ```

#### 2. `me` (Protected)
Returns the currently authenticated user's profile.

### Mutations

#### 1. `register`
Creates a new user account.
- **Mutation:**
  ```graphql
  mutation {
    register(name: "John Doe", email: "john@example.com", password: "securepassword")
  }
  ```

#### 2. `login`
Authenticates a user and returns access and refresh tokens.
- **Mutation:**
  ```graphql
  mutation {
    login(email: "john@example.com", password: "securepassword") {
      accessToken
      refreshToken
    }
  }
  ```

#### 3. `refreshToken`
Generates a new set of tokens using a valid refresh token.

## Tech Stack
- **Apollo Server 5**: GraphQL server implementation.
- **Express 5**: Web framework.
- **@as-integrations/express5**: Connector for Apollo Server and Express 5.
- **Mongoose**: MongoDB object modeling.
- **Typescript**: Typed JavaScript.

## Important Note on Integrations
This project uses **Apollo Server 5**. In this version, Express integration is no longer built-in. We use the dedicated `@as-integrations/express5` package to provide the `expressMiddleware`.
