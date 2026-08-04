const serviceUrl = "http://localhost:3000";

async function runDemo() {
  // A unique username prevents "username already exists" errors on later runs.
  const username = `demo-user-${Date.now()}`;
  const password = "squidgame1";
  const newPassword = "newSquid2";

  console.log("\n1. Sending registration request...");

  const registerResponse = await fetch(`${serviceUrl}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  const registerData = await registerResponse.json();
  console.log("Registration response:", registerData);

  if (!registerResponse.ok) {
    throw new Error("Registration failed");
  }

  console.log("\n2. Sending login request...");

  const loginResponse = await fetch(`${serviceUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: password,
    }),
  });

  const loginData = await loginResponse.json() as {
    success: boolean;
    token?: string;
    error?: string;
  };

  console.log("Login response:", loginData);

  if (!loginResponse.ok || !loginData.token) {
    throw new Error("Login failed");
  }

  const token = loginData.token;

  console.log("\n3. Sending token-validation request...");

  const validationResponse = await fetch(`${serviceUrl}/validate`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const validationData = await validationResponse.json();
  console.log("Validation response:", validationData);

  if (!validationResponse.ok) {
    throw new Error("Token validation failed");
  }

  console.log("\n4. Sending password-change request...");

  const passwordResponse = await fetch(`${serviceUrl}/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      currentPassword: password,
      newPassword: newPassword,
    }),
  });

  const passwordData = await passwordResponse.json();
  console.log("Password-change response:", passwordData);

  if (!passwordResponse.ok) {
    throw new Error("Password change failed");
  }

  console.log("\n5. Logging in with the new password...");

  const secondLoginResponse = await fetch(`${serviceUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: username,
      password: newPassword,
    }),
  });

  const secondLoginData = await secondLoginResponse.json();
  console.log("Second login response:", secondLoginData);

  if (!secondLoginResponse.ok) {
    throw new Error("Login with the new password failed");
  }

  console.log("\nDemo completed successfully.");
}

runDemo().catch((error) => {
  console.error("\nDemo failed:", error);
  console.error("Make sure the authentication service is running.");
  process.exit(1);
});
