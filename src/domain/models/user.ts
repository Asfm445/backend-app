// src/domain/models/user.ts

export interface Token {
  id: string;   
  userId: string;    // unique identifier for the token (e.g., UUID)
  token: string;    // the JWT string itself
  createdAt?: Date; // optional timestamp
  expireAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;     // optional, e.g., "user" | "admin"
}

export interface UserRegister {
  name: string;
  email: string;
  password: string;
}

export interface Payload{
  userId: string,
  role: string,
}

export interface DecodedPayload{
  userId: string,
  role: string,
  ExpireAt: Date,
  id?: string
}

export interface GoogleUserInput{
  name: string;
  email: string;
  googleId: string;
  role: string;
}

export interface GoogleUser{
  id: string;
  name: string;
  email: string;
  googleId: string;
  role: string;
}