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
