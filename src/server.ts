import "dotenv/config";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createApp, type User, type UserStore } from "./app.js";

class JsonUserStore implements UserStore {
  constructor(private readonly path: string) {}

  private async all(): Promise<User[]> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as User[];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async find(username: string) {
    return (await this.all()).find((user) => user.username === username);
  }

  async save(user: User) {
    const users = await this.all();
    const index = users.findIndex((item) => item.username === user.username);
    if (index === -1) users.push(user);
    else users[index] = user;

    await mkdir(dirname(this.path), { recursive: true });
    const temporaryPath = `${this.path}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(users, null, 2));
    await rename(temporaryPath, this.path);
  }
}

const secret = process.env.JWT_SECRET;
if (!secret) throw new Error("JWT_SECRET is required. Copy .env.example to .env.");

const port = Number(process.env.PORT ?? 3000);
const store = new JsonUserStore(resolve("data/users.json"));

createApp(store, secret).listen(port, () => {
  console.log(`Authentication service running at http://localhost:${port}`);
});
