import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import crypto from "crypto";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const CLIENT_ID = "app_Lm1pKoAki3PWjp";
const CLIENT_SECRET = process.env.WHOP_CLIENT_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET || "opsrelic-local-secret-123456";

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser(SESSION_SECRET));

  // Force www on production for consistent auth origins
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      if (req.hostname === 'opsrelic.com') {
        return res.redirect(301, `https://www.opsrelic.com${req.originalUrl}`);
      }
      next();
    });
  }

  // Static files FIRST to ensure assets like logo.png are served correctly in production
  if (process.env.NODE_ENV === "production") {
    const distPath = path.resolve(__dirname, "dist");
    const publicPath = path.resolve(__dirname, "public");
    console.log("Production static serving paths:", { distPath, publicPath });
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
  }

  // Whop OAuth Login - Start PKCE flow
  app.get("/api/auth/whop/login", (req, res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const code_verifier = crypto.randomBytes(32).toString('base64url');
    const code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64url');

    const cookieOptions = { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'lax' as const, 
      maxAge: 15 * 60 * 1000 // 15 mins
    };
    
    res.cookie('whop_state', state, cookieOptions);
    res.cookie('whop_verifier', code_verifier, cookieOptions);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: "https://www.opsrelic.com/api/auth/whop/callback",
      response_type: 'code',
      state: state,
      code_challenge: code_challenge,
      code_challenge_method: 'S256',
      scope: 'openid profile email membership:update member:basic:read member:email:read'
    });

    const authorizeUrl = `https://api.whop.com/oauth/authorize?${params.toString()}`;
    console.log("Redirecting to Whop Authorize:", authorizeUrl);
    res.redirect(authorizeUrl);
  });

  // Whop OAuth Callback - Exchange code for tokens
  app.get("/api/auth/whop/callback", async (req, res) => {
    const { code, state } = req.query;
    const { whop_state, whop_verifier } = req.cookies;

    console.log("OAuth Callback Received:", { 
      state, 
      storedState: whop_state, 
      hasCode: !!code,
      hasVerifier: !!whop_verifier
    });

    if (!state || state !== whop_state) {
      console.error("State Mismatch Error:", { provided: state, expected: whop_state });
      return res.status(400).send("Security verification failed: State mismatch or expired session.");
    }

    if (!whop_verifier) {
      console.error("Verifier Missing from cookies");
      return res.status(400).send("Security verification failed: Code verifier missing.");
    }

    try {
      const body = {
        grant_type: "authorization_code",
        code,
        redirect_uri: "https://www.opsrelic.com/api/auth/whop/callback",
        client_id: CLIENT_ID,
        code_verifier: whop_verifier
      };

      console.log("Exchanging tokens with Whop token endpoint...");
      
      const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok) {
        console.error("TOKEN ENDPOINT FAILURE RESPONSE:", JSON.stringify(tokenData, null, 2));
        return res.status(tokenResponse.status).json({
          error: "Token exchange failed",
          details: tokenData
        });
      }

      console.log("Token exchange success. Fetching user info...");

      const userResponse = await fetch("https://api.whop.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      
      if (!userResponse.ok) {
        const userErr = await userResponse.text();
        console.error("UserInfo API Failure:", userErr);
        throw new Error("Failed to fetch user info from Whop");
      }

      const userData = await userResponse.json();

      res.cookie('opsrelic_session', JSON.stringify({
        userId: userData.sub,
        name: userData.name || userData.username,
        email: userData.email,
        accessToken: tokenData.access_token,
        isLoggedIn: true,
      }), {
        httpOnly: true, 
        secure: true, 
        signed: true, 
        maxAge: 30 * 24 * 60 * 60 * 1000, 
        sameSite: 'lax',
      });

      res.clearCookie('whop_state');
      res.clearCookie('whop_verifier');
      console.log("Login successful, redirecting to home");
      res.redirect("/");
    } catch (error) {
      console.error("Whop OAuth Full Flow Error:", error);
      res.status(500).send("Authentication failed during code exchange.");
    }
  });

  // Exchange Endpoint - Sets secure session cookie
  app.post("/api/auth/whop/exchange", async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).send("Missing code or code_verifier");
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
          redirect_uri: redirect_uri || process.env.WHOP_REDIRECT_URI || "https://www.opsrelic.com/api/auth/whop/callback",
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
    // Production SPA fallback
    const distPath = path.resolve(__dirname, "dist");
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
