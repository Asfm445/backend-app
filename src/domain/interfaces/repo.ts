import { User,Token, UserRegister, GoogleUser, GoogleUserInput } from "../models/user";
export interface UserRepository {
  insert(user: UserRegister, role: string): void;
  find(email: string): Promise<User | undefined>;
  storeToken(token: Token): Promise<void>
  countUsers(): Promise<number>
  findTokenById(id: string): Promise<Token | undefined>
  deleteTokenById(id: string): Promise<void>
  insertGoogleUser(user: GoogleUserInput): Promise<void>
  findGoogleUserByEmail(email: string): Promise<GoogleUser | undefined>
}
