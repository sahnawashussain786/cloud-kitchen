import { useState } from "react";
import { api } from "../api.js";
import AdminDashboard from "./AdminDashboard.jsx";

// Separate /admin area for the kitchen owner only — protected by a passcode.
// The passcode is kept in localStorage so the owner stays signed in on this device.
export default function AdminApp() {
  const [password, setPassword] = useState(
    localStorage.getItem("sk-admin-pass") || "",
  );
  const [loginError, setLoginError] = useState("");
  const [checking, setChecking] = useState(false);
  const [signedIn, setSignedIn] = useState(!!password);

  const login = async (e) => {
    e.preventDefault();
    setChecking(true);
    setLoginError("");
    try {
      await api.adminLogin(password);
      localStorage.setItem("sk-admin-pass", password);
      setSignedIn(true);
    } catch {
      setLoginError("Invalid password. Try again.");
    } finally {
      setChecking(false);
    }
  };

  const onSignOut = () => {
    localStorage.removeItem("sk-admin-pass");
    setSignedIn(false);
    setPassword("");
  };

  if (!signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-walnut-deep px-4">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-2xl bg-cream p-8 shadow-2xl"
        >
          <p className="text-4xl">🍽</p>
          <h1 className="mt-3 font-display text-2xl font-semibold text-walnut">
            Shahnaz Kitchen <span className="text-clay">— Admin</span>
          </h1>
          <p className="mt-1 mb-6 text-sm text-stone-500">
            The kitchen owner&apos;s private dashboard.
            <br />
            Default password:{" "}
            <span className="font-mono text-clay">shahnaz123</span>
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="mb-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 focus:border-clay focus:outline-none"
          />
          {loginError && (
            <p className="mb-3 rounded-xl bg-red-900/10 p-2.5 text-sm text-red-800">
              {loginError}
            </p>
          )}
          <button
            type="submit"
            disabled={checking || !password}
            className="w-full rounded-xl bg-walnut py-2.5 font-semibold text-cream transition hover:bg-walnut-deep disabled:bg-stone-300"
          >
            {checking ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminDashboard
      password={password}
      onSignOut={onSignOut}
    />
  );
}
