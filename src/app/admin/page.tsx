
'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { getAllSolutionsForAdmin } from '@/lib/db';
import AdminSolutionList from '@/components/AdminSolutionList';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import AdminLoginForm from '@/components/AdminLoginForm';

export const metadata = {
  title: 'Admin Dashboard | CSES Solver Blogs',
  description: 'Manage submitted solutions.',
};

export default async function AdminPage() {
  const solutions = await getAllSolutionsForAdmin();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (username, password) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      const { token } = await res.json();
      Cookies.set('adminToken', token, { expires: 7 }); // Store token for 7 days
      setIsLoggedIn(true);
    } else {
      // Handle login error (e.g., display an error message)
      console.error('Login failed');
    }
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = Cookies.get('adminToken');
      if (token) {
        // Here you would ideally verify the token with your backend
        setIsLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">Admin Dashboard</h1>
        <p className="mt-3 text-lg text-muted-foreground">Manage and approve submitted solutions.</p>
      </div>
      {isLoggedIn ? (
        solutions.length === 0 ? (
          <Card className="text-center p-10">
            <CardTitle className="text-2xl font-semibold">No Solutions Submitted Yet</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Once users submit solutions, they will appear here for review.
            </CardDescription>
          </Card>
        ) : (
          <AdminSolutionList initialSolutions={solutions} />
        )
      ) : (
        <AdminLoginForm onLogin={handleLogin} />
      )}
    </div>
  );
