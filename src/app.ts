import bcrypt from "bcryptjs";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

export type User = { username: string; passwordHash: string };

export interface UserStore {
  find(username: string): Promise<User | undefined>;
  save(user: User): Promise<void>;
}

interface AuthRequest extends Request {
  username?: string;
}

export function createApp(store: UserStore, secret: string) {
  const app = express();
  app.use(express.json());

  function requireToken(req: AuthRequest, res: Response, next: NextFunction) {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : undefined;

    if (!token) {
      res.status(401).json({ success: false, error: "Token required" });
      return;
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      req.username = String(payload.username);
      next();
    } catch {
      res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
  }

  app.get("/health", (_req, res) => {
    res.json({ success: true, service: "authentication" });
  });

  app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || username.trim().length < 3 ||
        typeof password !== "string" || password.length < 8) {
      res.status(400).json({
        success: false,
        error: "Username must be 3+ characters and password must be 8+ characters",
      });
      return;
    }

    const normalizedUsername = username.trim().toLowerCase();
    if (await store.find(normalizedUsername)) {
      res.status(409).json({ success: false, error: "Username already exists" });
      return;
    }

    await store.save({
      username: normalizedUsername,
      passwordHash: await bcrypt.hash(password, 10),
    });
    res.status(201).json({ success: true, message: "User registered" });
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (typeof username !== "string" || typeof password !== "string") {
      res.status(400).json({ success: false, error: "Username and password required" });
      return;
    }

    const user = await store.find(username.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: "Invalid username or password" });
      return;
    }

    const token = jwt.sign({ username: user.username }, secret, { expiresIn: "1h" });
    res.json({ success: true, token });
  });

  app.get("/validate", requireToken, (req: AuthRequest, res) => {
    res.json({ success: true, valid: true, username: req.username });
  });

  app.post("/change-password", requireToken, async (req: AuthRequest, res) => {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== "string" ||
        typeof newPassword !== "string" || newPassword.length < 8) {
      res.status(400).json({ success: false, error: "New password must be 8+ characters" });
      return;
    }

    const user = await store.find(req.username!);
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(401).json({ success: false, error: "Current password is incorrect" });
      return;
    }

    await store.save({ ...user, passwordHash: await bcrypt.hash(newPassword, 10) });
    res.json({ success: true, message: "Password changed" });
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: "Route not found" });
  });

  return app;
}
