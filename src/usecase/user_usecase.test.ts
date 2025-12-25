// user_usecase.test.ts

// --- 1. Imports ---
import { UserUseCase } from "./user_usecase"; // Adjust path as needed

// Import interfaces and models needed for types
import { UserRepository } from "../domain/interfaces/repo"; // Assuming this is where UserRepository is
import { IJwtService } from "../domain/interfaces/jwt_service"; // Adjusted path based on your interface file name
import { BadRequestError, NotFoundError } from "../domain/interfaces/Exceptions"; // Assuming exception location
import { User, Token, Payload, DecodedPayload, GoogleUser } from "../domain/models/user"; // Assuming model location
import { PasswordHasher } from "../domain/interfaces/password_service"; // Adjusted path based on your interface file name

// --- 2. Mock Implementations (Type-Checked against Interfaces) ---

// Create a mock for the User Repository (implementing UserRepository)
const mockRepo: jest.Mocked<UserRepository> = {
  find: jest.fn(),
  countUsers: jest.fn(),
  insert: jest.fn(),
  storeToken: jest.fn(),
  findTokenById: jest.fn(),
  deleteTokenById: jest.fn(),
  findGoogleUserByEmail: jest.fn(),
  insertGoogleUser: jest.fn(),
};



// Create a mock for the JWT Service (implementing IJwtService)
const mockJwtService: jest.Mocked<IJwtService> = {
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

// export interface PasswordHasher {
//   hash(password: string): Promise<string>;
//   compare(password: string, hashed: string): Promise<boolean>;
//   hashRefreshToken(token: string): string
// }


// Create a mock for the Password Hasher (implementing PasswordHasher)
const mockPassHasher: jest.Mocked<PasswordHasher> = {
  hash: jest.fn(),
  compare: jest.fn(),
  hashRefreshToken: jest.fn(),
};


// --- 3. Test Suite Setup ---

describe('UserUseCase', () => {
  let userUseCase: UserUseCase;

  // Mock data
  const mockUser: User = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    role: 'user',
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token.plain', // The plain token returned to the client
  };

  const mockRefreshObject: Token = {
    id: 'token-id-456',
    userId: mockUser.id,
    token: 'mock.refresh.token.hashed', // The stored hashed token
    expireAt: new Date(Date.now() + 3600000), // 1 hour from now
  };

  const mockPayload: Payload = { userId: mockUser.id, role: mockUser.role };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize the Use Case with mocks
    userUseCase = new UserUseCase(mockRepo, mockJwtService, mockPassHasher);

    // Default mock responses for common methods
    mockJwtService.signAccessToken.mockReturnValue(mockTokens.accessToken);
    mockJwtService.signRefreshToken.mockReturnValue({
      id: mockRefreshObject.id,
      token: mockTokens.refreshToken, // The plain token before hashing
      userId: mockUser.id,
      expireAt: mockRefreshObject.expireAt,
    });
    // This mock implementation is crucial: it takes the plain token and returns the stored hash
    mockPassHasher.hashRefreshToken.mockImplementation((token: string) => 
        token === mockTokens.refreshToken ? mockRefreshObject.token : 'default-hash'
    );
  });

  // ----------------------------------------------------
  // 🔐 1. Register Method Tests
  // ----------------------------------------------------

  describe('register', () => {
    it('should successfully register a new standard user', async () => {
      mockRepo.find.mockResolvedValue(undefined);
      mockRepo.countUsers.mockResolvedValue(5); 
      mockPassHasher.hash.mockResolvedValue('newly-hashed-password');

      const result = await userUseCase.register({
        name: 'New User',
        email: 'new@test.com',
        password: 'password123',
      });

      expect(result).toBe("User registered successfully!");
      expect(mockRepo.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@test.com',
          password: 'newly-hashed-password',
        }),
        'user' // Standard role
      );
    });

    it('should register the very first user as superadmin', async () => {
      mockRepo.find.mockResolvedValue(undefined);
      mockRepo.countUsers.mockResolvedValue(0); 
      mockPassHasher.hash.mockResolvedValue('superadmin-hashed-password');

      await userUseCase.register({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'adminpassword',
      });

      expect(mockRepo.insert).toHaveBeenCalledWith(expect.any(Object), 'superadmin');
    });

    it('should throw BadRequestError if user already exists', async () => {
      mockRepo.find.mockResolvedValue(mockUser);

      await expect(
        userUseCase.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ----------------------------------------------------
  // 🔑 2. Login Method Tests
  // ----------------------------------------------------

  describe('login', () => {
    it('should successfully log in and return tokens', async () => {
      mockRepo.find.mockResolvedValue(mockUser);
      mockPassHasher.compare.mockResolvedValue(true); // Password match

      const result = await userUseCase.login('test@example.com', 'password123');

      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(mockPassHasher.compare).toHaveBeenCalledWith('password123', mockUser.password);
      
      // Check if the HASHED refresh token was stored
      expect(mockRepo.storeToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockRefreshObject.token,
          userId: mockUser.id,
        })
      );
    });

    it('should throw NotFoundError if user not found', async () => {
      mockRepo.find.mockResolvedValue(undefined);

      await expect(userUseCase.login('unknown@example.com', 'password123')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError if password comparison fails', async () => {
      mockRepo.find.mockResolvedValue(mockUser);
      mockPassHasher.compare.mockResolvedValue(false); // Password mismatch

      await expect(userUseCase.login('test@example.com', 'wrong-password')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  // ----------------------------------------------------
  // 🔄 3. Refresh Token Method Tests
  // ----------------------------------------------------

  describe('refreshToken', () => {
    const oldRefreshToken = mockTokens.refreshToken;
    const verifiedPayload = { id: mockRefreshObject.id, userId: mockUser.id, role: mockUser.role } as DecodedPayload;

    beforeEach(() => {
      mockJwtService.verifyRefreshToken.mockReturnValue(verifiedPayload);
      mockRepo.findTokenById.mockResolvedValue(mockRefreshObject);
    });

    it('should successfully rotate tokens and return new tokens', async () => {
      const newAccess = 'new.access.token';
      const newRefreshPlain = 'new.refresh.token.plain';
      const newRefreshHashed = 'new.refresh.token.hashed';

      // Setup new token values
      mockJwtService.signAccessToken.mockReturnValue(newAccess);
      mockJwtService.signRefreshToken.mockReturnValue({
        id: 'new-token-id',
        token: newRefreshPlain,
        userId: mockUser.id,
        expireAt: new Date(Date.now() + 7200000), // New expiry
      });
      // Update hash implementation to handle the new token
      mockPassHasher.hashRefreshToken.mockImplementation((token: string) => {
        if (token === oldRefreshToken) return mockRefreshObject.token;
        if (token === newRefreshPlain) return newRefreshHashed;
        return '';
      });

      const result = await userUseCase.refreshToken(oldRefreshToken);

      expect(result.accessToken).toBe(newAccess);
      expect(result.refreshToken).toBe(newRefreshPlain);
      
      // Verify the old token was deleted
      expect(mockRepo.deleteTokenById).toHaveBeenCalledWith(mockRefreshObject.id);
      
      // Verify the new token (hashed) was stored
      expect(mockRepo.storeToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: newRefreshHashed,
          userId: mockUser.id,
        })
      );
    });

    it('should throw BadRequestError if the provided token does not match the stored hash (tampering)', async () => {
      // Make the token hash check fail
      mockPassHasher.hashRefreshToken.mockImplementation(() => 'totally-different-hash-failure');
      
      await expect(userUseCase.refreshToken(oldRefreshToken)).rejects.toThrow(BadRequestError);
      expect(mockRepo.deleteTokenById).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError if token is expired', async () => {
      // Set the token to be expired
      const expiredToken = { ...mockRefreshObject, expireAt: new Date(Date.now() - 1000) };
      mockRepo.findTokenById.mockResolvedValue(expiredToken);

      await expect(userUseCase.refreshToken(oldRefreshToken)).rejects.toThrow(BadRequestError);
    });
    
    // ... (omitting other error tests like token not found, invalid token, for brevity)
  });

  // ----------------------------------------------------
  // 🌐 4. Google OAuth Tests
  // ----------------------------------------------------

  describe('loginOrRegisterGoogleUser', () => {
    const googleUserData = {
      email: 'google@test.com',
      name: 'Google User',
      googleId: 'google-12345',
    };
    const mockGoogleUser: GoogleUser = {
        id: 'google-user-id',
        name: googleUserData.name,
        email: googleUserData.email,
        googleId: googleUserData.googleId,
        role: 'user',
    };
    
    it('should register a new Google user and return tokens', async () => {
      // 1st call: find user returns null; 2nd call: find user returns newly created user
      mockRepo.findGoogleUserByEmail.mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockGoogleUser);
      mockRepo.countUsers.mockResolvedValue(5); 
      
      const result = await userUseCase.loginOrRegisterGoogleUser(
          googleUserData.email,
          googleUserData.name,
          googleUserData.googleId
      );

      expect(mockRepo.insertGoogleUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' })
      );
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });

    it('should log in an existing Google user and return tokens', async () => {
      mockRepo.findGoogleUserByEmail.mockResolvedValue(mockGoogleUser);

      const result = await userUseCase.loginOrRegisterGoogleUser(
          googleUserData.email,
          googleUserData.name,
          googleUserData.googleId
      );

      expect(mockRepo.insertGoogleUser).not.toHaveBeenCalled();
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });
  });
});