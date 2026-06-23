import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import type { User } from "../types/index.ts";

// Replace with a real POST /api/auth/login call later.
const MOCK_ACCOUNT = {
  email: "frieren@example.com",
  password: "123456",
  user: {
    id: 1,
    firstName: "Frieren",
    lastName: "The Mage",
    email: "frieren@example.com",
    avatarUrl: undefined,
    isActive: true,
    isAdmin: false,
    createdAt: "2026-05-17",
  } satisfies User,
};

export const LoginPage = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { emailRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (
      email.trim().toLowerCase() === MOCK_ACCOUNT.email &&
      password === MOCK_ACCOUNT.password
    ) {
      onLogin(MOCK_ACCOUNT.user);
      navigate("/feeds");
    } else {
      setError("Incorrect email or password");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* Login Card */}
      <div className="w-full max-w-lg bg-white rounded-xl shadow-md p-8">
        <div className="mb-8 text-center">
          <span className="text-5xl font-bold text-blue-800 tracking-tight">FotoBook</span>
          <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-2">
            <i className="fa-solid fa-circle-exclamation mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Log in form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="login-email" className="block font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              ref={emailRef}
              id="login-email"
              type="email"
              autoComplete="email"
              required
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="login-password" className="block font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="******"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <a href="#" className="text-blue-700 hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-800 py-3 font-semibold text-white hover:bg-blue-700 transition-colors 
            disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <i className="fa-solid fa-spinner fa-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-sm text-gray-400">or continue with</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Social login placeholders */}
        <div className="w-full flex items-center justify-around text-5xl space-y-2">
          <button id="google-btn"
            className="rounded-lg cursor-pointer"
          >
            <i className={`fa-brands fa-google text-red-600`} />
          </button>
          <button id="google-btn"
            className="rounded-lg cursor-pointer"
          >
            <i className={`fa-brands fa-facebook text-blue-600`} />
          </button>
          <button id="google-btn"
            className="rounded-lg cursor-pointer"
          >
            <i className={`fa-brands fa-twitter text-sky-600`} />
          </button>
        </div>

        {/* Sign up link */}
        <p className="mt-8 text-center text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-blue-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};