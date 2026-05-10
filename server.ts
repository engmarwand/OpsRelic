import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
if (process.env.FIREBASE_PROJECT_ID) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const db = admin.apps.length ? admin.firestore() : null;

  // Initialize Stripe (optional if sticking to Whop)
  const stripe = process.env.STRIPE_SECRET_KEY 
    ? new Stripe(process.env.STRIPE_SECRET_KEY) 
    : null;

  // Whop Webhook endpoint
  app.post("/api/webhook/whop", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["x-whop-signature"];
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      console.warn("Whop Webhook received but keys are missing.");
      return res.status(400).send("Webhook Error: Missing configuration");
    }

    // Direct HMAC validation for Whop
    const crypto = await import("crypto");
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const bodyString = req.body.toString();
    const digest = hmac.update(bodyString).digest("hex");

    if (sig !== digest) {
      console.error("Invalid Whop signature");
      return res.status(401).send("Invalid signature");
    }

    const event = JSON.parse(bodyString);
    console.log("Whop Event Received:", event.action);

    // Handle membership events
    if (event.action === "membership.went_active" || event.action === "membership.updated") {
      const { user_id, email, plan_id } = event.data;
      
      // Determine plan name from plan_id (you should map these to your plan names)
      let planName = 'pro'; // default
      // Whop plan mapping (example)
      if (plan_id.includes('agency')) planName = 'agency';
      
      console.log(`Whop Membership activated for ${email} (${user_id}). Plan: ${planName}`);

      if (db) {
        try {
          // Attempt to find the user by email in Firestore if no pass-through ID is found
          // (Better to use pass-through ID, but email is a fallback)
          const usersRef = db.collection('users');
          const snapshot = await usersRef.where('email', '==', email).get();

          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({
              plan: planName,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Successfully updated plan for user ${email}`);
          } else {
            console.warn(`User with email ${email} not found in Firestore yet.`);
          }
        } catch (err) {
          console.error("Firestore update error:", err);
        }
      }
    }

    res.json({ received: true });
  });

  app.use(express.json());

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Clip Analytics Endpoint
  app.post("/api/clip-refresh", express.json(), async (req, res) => {
    try {
      const { clipLinkId, url, campaignId, userId } = req.body;
      if (!url || !campaignId || !userId || !clipLinkId) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      let platform = "unknown";
      let clipId = "";
      if (url.includes("tiktok.com")) {
        platform = "tiktok";
        const match = url.match(/video\/(\d+)/);
        if (match) clipId = match[1];
      } else if (url.includes("instagram.com/reel")) {
        platform = "instagram";
        const match = url.match(/reel\/([a-zA-Z0-9_\-]+)/);
        if (match) clipId = match[1];
      } else if (url.includes("youtube.com/shorts")) {
        platform = "youtube";
        const match = url.match(/shorts\/([a-zA-Z0-9_\-]+)/);
        if (match) clipId = match[1];
      } else {
        return res.status(400).json({ error: "Unsupported URL" });
      }

      if (!clipId) {
        return res.status(400).json({ error: "Could not identify clip ID from URL" });
      }

      // Fetch from platform
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });
      
      if (!response.ok) {
        throw new Error(`Blocked or unavailable: ${response.status}`);
      }

      const html = await response.text();
      
      let views = 0;
      let likes = 0;
      let comments = 0;

      if (platform === "tiktok") {
        const playCountMatch = html.match(/"playCount":(\d+)/);
        const diggCountMatch = html.match(/"diggCount":(\d+)/);
        const commentCountMatch = html.match(/"commentCount":(\d+)/);
        if (playCountMatch) views = parseInt(playCountMatch[1], 10);
        if (diggCountMatch) likes = parseInt(diggCountMatch[1], 10);
        if (commentCountMatch) comments = parseInt(commentCountMatch[1], 10);
      } else if (platform === "instagram") {
        const viewCountMatch = html.match(/"video_view_count":(\d+)/);
        const likeCountMatch = html.match(/"like_count":(\d+)/);
        const commentCountMatch = html.match(/"comment_count":(\d+)/);
        if (viewCountMatch) views = parseInt(viewCountMatch[1], 10);
        if (likeCountMatch) likes = parseInt(likeCountMatch[1], 10);
        if (commentCountMatch) comments = parseInt(commentCountMatch[1], 10);
      } else if (platform === "youtube") {
        const viewCountMatch = html.match(/"viewCount":"(\d+)"/);
        const likeCountMatch = html.match(/"defaultText":{"accessibility":{"accessibilityData":{"label":"([\d,]+) likes/);
        if (viewCountMatch) views = parseInt(viewCountMatch[1], 10);
        if (likeCountMatch) likes = parseInt(likeCountMatch[1].replace(/,/g, ''), 10);
      }

      if (views === 0 && likes === 0) {
         throw new Error("Could not parse metrics (private video or blocked platform)");
      }

      const engagementRate = views > 0 ? ((likes + comments) / views) : 0;

      if (db) {
        // Find existing clipMetrics doc or create new
        const metricsSnapshot = await db.collection('clipMetrics').where('clipLinkId', '==', clipLinkId).limit(1).get();
        if (!metricsSnapshot.empty) {
          const doc = metricsSnapshot.docs[0];
          await doc.ref.update({
            views,
            likes,
            comments,
            engagementRate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          await db.collection('clipMetrics').add({
            clipLinkId,
            campaignId,
            userId, // Workspace/User ID
            url,
            platform,
            clipId,
            views,
            likes,
            comments,
            engagementRate,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      res.json({ views, likes, comments, engagementRate });

    } catch (err: any) {
      console.error("Clip extraction error:", err.message);
      res.status(500).json({ error: err.message || "Failed to fetch metrics" });
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
