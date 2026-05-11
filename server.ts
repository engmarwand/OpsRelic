import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Stripe from "stripe";

import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let firestoreDatabaseId: string | undefined = undefined;
let firestoreProjectId: string | undefined = undefined;

try {
  console.log("--- Firebase Admin Initialization ---");
  if (fs.existsSync(path.join(process.cwd(), "firebase-applet-config.json"))) {
    const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8"));
    firestoreDatabaseId = config.firestoreDatabaseId;
    firestoreProjectId = config.projectId;
  }
  
  if (admin.apps.length === 0) {
    const projectToUse = process.env.FIREBASE_PROJECT_ID || firestoreProjectId;
    if (projectToUse) {
      console.log(`Initializing Firebase Admin with Project: ${projectToUse}`);
      // Manually set project if provided to ensure getFirestore targets the right one
      if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = projectToUse;
      admin.initializeApp({ projectId: projectToUse });
    } else {
      console.log("Initializing Firebase Admin with ADC");
      admin.initializeApp();
    }
  }
} catch (e) {
  console.error("Firebase Admin initialization error:", e);
}

async function startServer() {
  console.log("Starting OpsRelic server...");
  try {
    const app = express();
    const PORT = 3000;
    
    let db: admin.firestore.Firestore | null = null;
    if (admin.apps.length > 0) {
      try {
        const adminApp = admin.app();
        console.log(`Firebase App Name: ${adminApp.name}, Project ID in app options: ${adminApp.options.projectId || 'ADC/detected'}`);
        
        if (firestoreDatabaseId && firestoreDatabaseId !== "(default)" && firestoreDatabaseId !== "") {
          console.log(`Attempting to initialize Firestore with Database ID: ${firestoreDatabaseId}`);
          db = (getFirestore as any)(firestoreDatabaseId);
        } else {
          db = getFirestore();
        }
        
        // Test connectivity
        await db.collection('_health').limit(1).get();
        console.log("Firestore connection test successful.");
      } catch (dbErr: any) {
        console.warn(`Firestore initialization/test failed for ${firestoreDatabaseId || 'default'}:`, dbErr.message);
        try {
          console.log("Attempting fallback to default Firestore database...");
          db = getFirestore();
          await db.collection('_health').limit(1).get();
          console.log("Fallback Firestore connection successful.");
        } catch (fallbackErr: any) {
          console.error("Critical: All Firestore connection attempts failed on startup:", fallbackErr.message);
          db = null;
        }
      }
    }

    // Health endpoint to debug Firebase permissions
    app.get("/api/firebase-health", (req, res) => {
      res.json({
        initialized: !!db,
        projectId: admin.apps.length > 0 ? (admin.app().options.projectId || 'ADC/detected') : 'not initialized',
        databaseId: firestoreDatabaseId || 'default',
        apps: admin.apps.length,
        env: {
          FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'missing',
          GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || 'missing'
        }
      });
    });

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
      
      // Whop plan mapping
      let planName: 'starter' | 'pro' | 'agency' = 'pro';
      if (plan_id === 'plan_5bnzRrzNEhrt7') planName = 'agency';
      else if (plan_id === 'plan_3abAVC0tgumce') planName = 'pro';
      else if (plan_id.includes('agency')) planName = 'agency';
      else if (plan_id.includes('pro')) planName = 'pro';
      else if (plan_id.includes('starter') || plan_id === 'free') planName = 'starter';
      
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
} catch (err) {
  console.error("CRITICAL: Server failed to start:", err);
}
}

/**
 * Handle Firestore errors according to integration guidelines
 */
function handleFirestoreError(error: any, operationType: string, path: string | null = null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: "system",
      isSystem: true
    },
    operationType,
    path
  };
  console.error('Firestore Error context:', JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

startServer();
