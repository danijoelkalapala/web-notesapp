import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === "/register";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = isRegister ? "/api/users/register" : "/api/users/login";
    const payload = isRegister
      ? {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      }
      : { email: formData.email, password: formData.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || (isRegister ? "Registration failed" : "Login failed")
        );
      }

      if (isRegister) {
        const userObj = data.user || data;
        const userId = userObj.id || userObj._id || userObj.userId;
        const userName = userObj.name || formData.name;

        sessionStorage.setItem("quick-notes-auth", "true");
        sessionStorage.setItem("quick-notes-user-id", userId);
        sessionStorage.setItem("quick-notes-user-name", userName);
        if (data.token) sessionStorage.setItem("quick-notes-token", data.token);
      } else {
        const token = data.token;
        const user = data.user;
        const userId = user ? user._id || user.id : null;
        const userName = user ? user.name : null;

        sessionStorage.setItem("quick-notes-auth", "true");
        sessionStorage.setItem("quick-notes-user-id", userId);
        sessionStorage.setItem("quick-notes-user-name", userName);
        if (token) sessionStorage.setItem("quick-notes-token", token);
      }

      navigate("/notes");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl transition-all duration-500">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center mb-6">
          {isRegister
            ? "Create New Account"
            : "Sign In Here"}
        </h1>
        <p className="text-center text-gray-500 mb-8">
          {isRegister
            ? "Enter your name, email and a password to create an new GAH Notemaker account."
            : "Access your notes with your credentials."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Your name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-500 transition-all duration-200 text-sm shadow-sm"
              />
            </div>
          )}
          <div className="mb-5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-500 transition-all duration-200 text-sm shadow-sm"
            />
          </div>
          <div className="mb-5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300/50 focus:border-gray-500 transition-all duration-200 text-sm shadow-sm pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 active:scale-98 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? isRegister
                ? "Registering..."
                : "Signing In..."
              : isRegister
                ? "Register"
                : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <Link
            to={isRegister ? "/login" : "/register"}
            className="font-medium text-gray-900 hover:text-gray-700"
          >
            {isRegister ? "Sign In" : "Register here"}
          </Link>
        </p>

        {
          error && (
            <p className="mt-4 text-center text-red-500 text-sm">{error}</p>
          )
        }
      </div >
    </div >
  );
};

export default Login;
