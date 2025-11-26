import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as leaderboard from "./leaderboard-simple.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-ae0b35aa/health", (c) => {
  return c.json({ status: "ok" });
});

// Stage 1: Simple test endpoint for leaderboard
app.get("/make-server-ae0b35aa/leaderboard/test", (c) => {
  return c.json({ 
    success: true, 
    message: "Leaderboard test endpoint working",
    timestamp: new Date().toISOString()
  });
});

// Stage 2: Submit score endpoint
app.post("/make-server-ae0b35aa/leaderboard/submit", async (c) => {
  try {
    const entry = await c.req.json();
    const result = await leaderboard.submitScore(entry);
    return c.json(result);
  } catch (error) {
    console.error('Error in /leaderboard/submit:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Stage 2: Get top scores endpoint
app.get("/make-server-ae0b35aa/leaderboard/top", async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const scores = await leaderboard.getTopScores(limit);
    return c.json({ success: true, scores });
  } catch (error) {
    console.error('Error in /leaderboard/top:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);