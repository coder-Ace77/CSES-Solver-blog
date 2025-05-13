"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Set a cookie expiration time (e.g., 7 days)
const COOKIE_EXPIRATION_DAYS = 7;

const AdminLoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Call the login API route
    fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          // Store the token in a cookie
          Cookies.set("admin_token", data.token, { expires: COOKIE_EXPIRATION_DAYS });
          // Optionally, redirect or update state to show admin content
          console.log("Login successful, token stored in cookie.");
          // For now, a simple reload to trigger the cookie check on the admin page
          window.location.reload();
        } else {
          console.error("Login failed:", data.message);
        }
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg">
        <h3 className="text-2xl font-bold text-center">Admin Login</h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
              <label className="block" htmlFor="username">
                Username
              </label>
              <Input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <label className="block" htmlFor="password">
                Password
              </label>
              <Input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="flex items-baseline justify-end mt-4">
              <Button
                type="submit"
                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900"
              >
                Login
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginForm;