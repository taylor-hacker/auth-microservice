import assert from "node:assert/strict";
import { test } from "node:test";
import { createApp, type User, type UserStore } from "../src/app.js";

class MemoryStore implements UserStore {
  users = new Map<string, User>();
  async find(username: string) { return this.users.get(username); }
  async save(user: User) { this.users.set(user.username, user); }
}

test("register, login, validate, and change password", async () => {
  const server = createApp(new MemoryStore(), "test-secret").listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test server failed");
  const base = `http://127.0.0.1:${address.port}`;

  const post = (path: string, body: object, token?: string) => fetch(base + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  try {
    assert.equal((await post("/register", {
      username: "User", password: "squidgame1",
    })).status, 201);

    const login = await post("/login", {
      username: "user", password: "squidgame1",
    });
    assert.equal(login.status, 200);
    const { token } = await login.json() as { token: string };
    assert.ok(token);

    const validate = await fetch(base + "/validate", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(validate.status, 200);

    const change = await post("/change-password", {
      currentPassword: "squidgame1", newPassword: "newSquid2",
    }, token);
    assert.equal(change.status, 200);

    assert.equal((await post("/login", {
      username: "user", password: "newSquid2",
    })).status, 200);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
