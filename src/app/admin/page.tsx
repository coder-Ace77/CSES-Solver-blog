
import { getAllSolutionsForAdmin } from '@/lib/db';
import AdminSolutionList from '@/components/AdminSolutionList';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import AdminLogoutButton from '@/components/AdminLogoutButton'; // New component for logout

export const metadata = {
  title: 'Admin Dashboard | CSES Solver Blogs',
  description: 'Manage submitted solutions.',
};

// This page is now protected by middleware.
// If the user reaches this page, they are authenticated.
export default async function AdminPage() {
  const solutions = await getAllSolutionsForAdmin();

  return (
    <div className="py-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Admin Dashboard
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Manage and approve submitted solutions.
          </p>
        </div>
        <AdminLogoutButton />
      </div>
      {solutions.length === 0 ? (
        <Card className="text-center p-10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">No Solutions Submitted Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="mt-2 text-muted-foreground">
              Once users submit solutions, they will appear here for review.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <AdminSolutionList initialSolutions={solutions} />
      )}
    </div>
  );
}
