export const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
  }

  type AuthPayload {
    accessToken: String!
    refreshToken: String!
  }

  type HealthStatus {
    status: String!
  }

  type Query {
    health: HealthStatus!
    me: User # Example of a protected query
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): String!
    login(email: String!, password: String!): AuthPayload!
    refreshToken(token: String!): AuthPayload!
  }
`;
