'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import AdminSolutionList from '@/components/AdminSolutionList';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminLoginForm from '@/components/AdminLoginForm';

export default function AdminPage() {
  const [solutions, setSolutions] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (username, password) => {
    console.log('Logging in with:', username  , password);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      Cookies.set('adminToken', token, { expires: 7 });
      setIsLoggedIn(true);
    } else {
      console.error('Login failed');
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = Cookies.get('adminToken');
      if (token) setIsLoggedIn(true);
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchSolutions = async () => {
        const res = await fetch('/api/admin/solutions');
        if (res.ok) {
          const data = await res.json();
          setSolutions(data);
        }
      };
      fetchSolutions();
    }
  }, [isLoggedIn]);

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Manage and approve submitted solutions.
        </p>
      </div>
      {isLoggedIn ? (
        solutions.length === 0 ? (
          <Card className="text-center p-10">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                No Solutions Submitted Yet
              </CardTitle>
            </CardHeader>
            <CardDescription className="mt-2 text-muted-foreground">
              Once users submit solutions, they will appear here for review.
            </CardDescription>
          </Card>
        ) : (
          <AdminSolutionList initialSolutions={solutions} />
        )
      ) : (
        <AdminLoginForm handleSubmit={handleLogin} />
      )}
    </div>
  );
}
