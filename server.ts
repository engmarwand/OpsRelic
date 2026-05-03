import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const CLIENT_ID = process.env.WHOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOP_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "opsrelic-local-secret-123456";

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser(SESSION_SECRET));

  // Whop OAuth Callback - Simplified to redirect back to frontend
  app.get("/api/auth/whop/callback", async (req, res) => {
    const { code, state } = req.query;
    
    const searchParams = new URLSearchParams();
    if (code) searchParams.set('code', code as string);
    if (state) searchParams.set('state', state as string);
    
    // Redirect back to root where the frontend will handle code exchange
    res.redirect(`/?${searchParams.toString()}`);
  });

  // Exchange Endpoint - Sets secure session cookie
  app.post("/api/auth/whop/exchange", async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).send("Missing code or code_verifier");
    }

    try {
      // 1. Exchange code for tokens
      const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          code_verifier,
          grant_type: "authorization_code",
          redirect_uri: redirect_uri || process.env.WHOP_REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Whop Exchange error:", errorData);
        return res.status(tokenResponse.status).json(errorData);
      }

      const tokens = await tokenResponse.json();
      const accessToken = tokens.access_token;

      // 2. Fetch user profile
      const userResponse = await fetch("https://api.whop.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userResponse.json();

      // 3. Set secure signed cookie
      const sessionData = {
        userId: userData.sub,
        whopUserId: userData.sub,
        name: userData.name,
        email: userData.email,
        accessToken: accessToken,
        isLoggedIn: true,
      };

      res.cookie('opsrelic_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        signed: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: 'lax',
      });

      res.json({ success: true, user: userData });
    } catch (error) {
      console.error("Auth server error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Get current session
  app.get("/api/auth/me", (req, res) => {
    const session = req.signedCookies.opsrelic_session;
    if (!session) {
      return res.status(401).json({ error: "No session" });
    }
    try {
      res.json(JSON.parse(session));
    } catch (e) {
      res.status(500).json({ error: "Invalid session" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('opsrelic_session');
    res.json({ success: true });
  });

  // Proxy to fetch memberships (using session token)
  app.get("/api/auth/whop/memberships", async (req, res) => {
    const sessionStr = req.signedCookies.opsrelic_session;
    if (!sessionStr) return res.status(401).send("Unauthorized");
    
    const session = JSON.parse(sessionStr);

    try {
      const response = await fetch("https://api.whop.com/api/v5/me/memberships", {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).send("Failed to fetch memberships");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
