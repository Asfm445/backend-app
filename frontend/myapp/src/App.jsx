// src/App.js
import React, { useEffect, useState } from "react";

const CLIENT_ID = "803733004222-d9s4jpvolmomujoh0h9a06ptopobddac.apps.googleusercontent.com";
const REDIRECT_URI = "http://localhost:5173";
const SCOPE = "openid profile email";
const RESPONSE_TYPE = "code";

function generateRandomString(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Encode string to Base64 URL
function base64URLEncode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// SHA256 hash
async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(buffer));
  return digest;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    if (code) {
      const codeVerifier = localStorage.getItem("code_verifier");
      // send code + codeVerifier to backend
      fetch("http://localhost:4000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, codeVerifier, redirect_uri: REDIRECT_URI }),
      })
        .then(res => res.json())
        .then(data => {setUser(data);console.log(data)})
        .catch(console.error);
    }
  }, []);

  const login = async () => {
    const codeVerifier = generateRandomString(128);
    localStorage.setItem("code_verifier", codeVerifier);
    const codeChallenge = base64URLEncode(await sha256(codeVerifier));

    const url = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${encodeURIComponent(SCOPE)}&code_challenge=${codeChallenge}&code_challenge_method=S256&access_type=offline`;
    window.location.href = url;
  };

  return (
    <div style={{ padding: 50 }}>
      {!user && <button onClick={login}>Login with Google</button>}
      {user && (
        <div>
          <h2>Welcome u have logged in</h2>
        </div>
      )}
    </div>
  );
}

export default App;
