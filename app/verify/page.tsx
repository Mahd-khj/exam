"use client";

import { useEffect, useState } from "react";

interface VerifyResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying your email...");

  useEffect(() => {
    // Extract token from the URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    // Call the backend verify endpoint
    fetch(`/api/auth/verify?token=${token}`)
      .then(async (res) => {
        const data: VerifyResponse = await res.json();
        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Invalid or expired verification token.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong during verification.");
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "#f9f9f9",
        fontFamily: "sans-serif",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      {status === "loading" && (
        <>
          <h1>Verifying your email...</h1>
          <p>Please wait a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 style={{ color: "green" }}>✅ Email Verified!</h1>
          <p>{message}</p>
          <a
            href="/login"
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              background: "#0070f3",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Go to Login
          </a>
        </>
      )}

      {status === "error" && (
        <>
          <h1 style={{ color: "red" }}>❌ Verification Failed</h1>
          <p>{message}</p>
          <a
            href="/signup"
            style={{
              marginTop: "1.5rem",
              padding: "0.75rem 1.5rem",
              background: "#0070f3",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            Go Back to Signup
          </a>
        </>
      )}
    </div>
  );
}
