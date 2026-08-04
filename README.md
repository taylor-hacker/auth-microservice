# Authentication Microservice

Registers users, authenticates login credentials, issues and validates tokens, and changes passwords.

## Setup

Node.js 18 or newer is required.

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Open `.env` and replace `JWT_SECRET` with a long random value.

Service URL: `http://localhost:3000`

## Requesting data

Send HTTP requests to the service. Send request bodies as JSON.

Example:

```typescript
const response = await fetch("http://localhost:3000/login", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    username: "user",
    password: "squidgame1"
  })
});
```

### Register

```http
POST /register
Content-Type: application/json

{ "username": "user", "password": "squidgame1" }
```

### Log in

```http
POST /login
Content-Type: application/json

{ "username": "user", "password": "squidgame1" }
```

### Validate token

```http
GET /validate
Authorization: Bearer authentication-token-here
```

### Change password

```http
POST /change-password
Authorization: Bearer authentication-token-here
Content-Type: application/json

{ "currentPassword": "squidgame1", "newPassword": "newSquid2" }
```

### Health check

```http
GET /health
```

## Receiving data

Responses are JSON. Read them with `response.json()`.

```typescript
const data = await response.json();

if (response.ok) {
  console.log(data);
} else {
  console.log(data.error);
}
```

Successful login:

```json
{ "success": true, "token": "authentication-token-here" }
```

Invalid login:

```json
{ "success": false, "error": "Invalid username or password" }
```

## Sequence diagram

```mermaid
sequenceDiagram
    participant T as Test Program
    participant A as Authentication Service
    participant U as User Store

    T->>A: POST /register with username and password
    A->>A: Hash password
    A->>U: Save username and password hash
    U-->>A: User saved
    A-->>T: 201 JSON success response

    T->>A: POST /login with username and password
    A->>U: Find username
    U-->>A: User and password hash
    A->>A: Compare password and create token
    A-->>T: 200 JSON response with token

    T->>A: GET /validate with Bearer token
    A->>A: Verify token
    A-->>T: 200 JSON response with validity and username
```

## Test

Automated test:

```powershell
npm test
npm run build
```

Demonstration client:

```powershell
npx tsx .\test\testAuth.ts
```

