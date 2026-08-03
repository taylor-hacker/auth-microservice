Node.js 18 or more recent-
bash
npm install
cp .env.example .env
npm run dev

open `.env` and replace `JWT_SECRET` with a long,
random value. service runs at `http://localhost:3000`

API requests---

Register:

```http
POST /register
Content-Type: application/json

{ "username": "user", "password": "squidgame1" }
```

Log in:

```http
POST /login
Content-Type: application/json

{ "username": "user", "password": "squidgame1" }
```

Successful login response:

```json
{ "success": true, "token": "authentication-token-here" }
```

Validate token:

```http
GET /validate
Authorization: Bearer authentication-token-here
```

Change password:

```http
POST /change-password
Authorization: Bearer authentication-token-here
Content-Type: application/json

{ "currentPassword": "squidgame1", "newPassword": "newSquid2" }
```

http
GET /health

To test-

bash
npm test
npm run build
