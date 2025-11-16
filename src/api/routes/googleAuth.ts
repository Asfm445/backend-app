import express, { Request, Response } from "express";
import axios from "axios";
import { UserController } from "../controller";

export const createGoogleAuthRouter = (userController: UserController) => {
  const router = express.Router();

  const CLIENT_ID = process.env.CLIENT_ID!; // Fixed: Better environment variable name
  const CLIENT_SECRET = process.env.CLIENT_SECRET!;

  interface AuthRequestBody {
    code: string;
    codeVerifier: string;
    redirect_uri: string;
  }

  router.post("/google", async (req: Request, res: Response) => {
    const { code, codeVerifier, redirect_uri } = req.body as AuthRequestBody;

    if (!code || !codeVerifier || !redirect_uri) {
      return res.status(400).json({ error: "Missing required OAuth parameters" });
    }

    // Validate environment variables
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("Missing Google OAuth environment variables");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      // Exchange code for token
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          code_verifier: codeVerifier,
          redirect_uri,
          grant_type: "authorization_code",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const { access_token } = tokenResponse.data;

      // Get user info from Google
      const userResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      const { email, name, sub, picture } = userResponse.data;

      // Validate required user data
      if (!email || !name || !sub) {
        return res.status(400).json({ error: "Incomplete user data from Google" });
      }

      // Call the controller method
      const result = await userController.loginOrRegisterGoogleUser(email, name, sub);

      res.status(200).json(result);
    } catch (err: any) {
      console.error("Google OAuth error:", err.response?.data || err.message);
      
      if (err.response?.status === 400) {
        return res.status(400).json({ error: "Invalid authorization code" });
      }
      
      res.status(500).json({ error: "Google OAuth failed" });
    }
  });

  return router;
};