import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const CLIENT_ID = process.env.WHOP_CLIENT_ID;
const CLIENT_SECRET = process.env.WHOP_CLIENT_SECRET;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Whop OAuth Callback - Simplified to redirect back to frontend
  app.get("/api/auth/whop/callback", async (req, res) => {
    const { code, state } = req.query;
    
    // Construct return URL with same params
    const searchParams = new URLSearchParams();
    if (code) searchParams.set('code', code as string);
    if (state) searchParams.set('state', state as string);
    
    res.redirect(`/?${searchParams.toString()}`);
  });

  // Dedicated Exchange Endpoint for PKCE
  app.post("/api/auth/whop/exchange", async (req, res) => {
    const { code, code_verifier, redirect_uri } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).send("Missing code or code_verifier");
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
          redirect_uri: redirect_uri || process.env.WHOP_REDIRECT_URI,
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("Whop Exchange error:", errorData);
        return res.status(tokenResponse.status).json(errorData);
      }

      const tokens = await tokenResponse.json();
      res.json(tokens);
    } catch (error) {
      console.error("Auth server error:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Proxy to fetch user info with token (to avoid CORS if client fetches directly)
  app.post("/api/auth/whop/userinfo", async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).send("Missing access token");

    try {
      const userResponse = await fetch("https://api.whop.com/oauth/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const userData = await userResponse.json();
      res.json(userData);
    } catch (error) {
      res.status(500).send("Failed to fetch user info");
    }
  });

  // Proxy to fetch memberships
  app.post("/api/auth/whop/memberships", async (req, res) => {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).send("Missing access token");

    try {
      const response = await fetch("https://api.whop.com/api/v5/me/memberships", {
        headers: { Authorization: `Bearer ${accessToken}` },
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
