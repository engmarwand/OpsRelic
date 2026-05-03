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
  app.set('trust proxy', 1);
  app.use(cookieParser(SESSION_SECRET));

  // Whop OAuth Login - Generates PKCE and redirects to Whop
  app.get("/api/auth/whop/login", async (req, res) => {
    const { redirect_uri } = req.query;
    if (!redirect_uri) return res.status(400).send("Missing redirect_uri");

    // Generate PKCE on server
    const crypto = await import("crypto");
    const code_verifier = crypto.randomBytes(32).toString('base64url');
    const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    // Store verifier and redirect_uri in temporary cookies
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none' as const,
      maxAge: 5 * 60 * 1000,
    };
    
    res.cookie('whop_pkce_verifier', code_verifier, cookieOptions);
    res.cookie('whop_redirect_uri', redirect_uri as string, cookieOptions);

    const scope = "openid profile email membership:update member:basic:read member:email:read member:stats:read plan:basic:read stats:read chat:read";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: CLIENT_ID!,
      redirect_uri: redirect_uri as string,
      scope,
      state,
      code_challenge,
      code_challenge_method: "S256",
    });

    res.redirect(`https://api.whop.com/oauth/authorize?${params.toString()}`);
  });

  // Whop OAuth Callback - Exchanges code and redirects to dashboard
  app.get("/api/auth/whop/callback", async (req, res) => {
    const { code, state } = req.query;
    const code_verifier = req.cookies.whop_pkce_verifier;
    const redirect_uri = req.cookies.whop_redirect_uri;

    if (!code || !code_verifier || !redirect_uri) {
      console.error("Callback missing parameters:", { code: !!code, verifier: !!code_verifier, redirect: !!redirect_uri });
      return res.redirect("/?error=auth_failed");
    }

    try {
      const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          code_verifier,
          grant_type: "authorization_code",
          redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code");
      }

      const tokens = await tokenResponse.json();
      const userResponse = await fetch("https://api.whop.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userData = await userResponse.json();

      const sessionData = {
        userId: userData.sub,
        whopUserId: userData.sub, // Added for consistency with useAuth.tsx
        name: userData.name,
        email: userData.email,
        accessToken: tokens.access_token,
        isLoggedIn: true,
      };

      // Set the session cookie
      res.cookie('opsrelic_session', JSON.stringify(sessionData), {
        httpOnly: true,
        secure: true,
        signed: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
      });

      // Clear temporary cookies
      res.clearCookie('whop_pkce_verifier');
      res.clearCookie('whop_redirect_uri');

      // Redirect to dashboard (using hash to support the internal routing)
      res.redirect("/#dashboard");
    } catch (error) {
      console.error("Callback error:", error);
      res.redirect("/?error=server_error");
    }
  });

  // Exchange Endpoint - Sets secure session cookie
  app.post("/api/auth/whop/exchange", async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier || !redirect_uri) {
      return res.status(400).send("Missing code, code_verifier, or redirect_uri");
    }

    try {
      if (!CLIENT_SECRET) {
        console.error("CRITICAL: WHOP_CLIENT_SECRET is missing from environment variables!");
        return res.status(500).json({ error: "Server configuration error: Missing Client Secret" });
      }

      console.log("Exchanging Whop code for tokens...", { code: code.substring(0, 5) + "...", redirect_uri });

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
          redirect_uri: redirect_uri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Whop Exchange error response:", errorData);
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
