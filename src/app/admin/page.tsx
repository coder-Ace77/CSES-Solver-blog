
import { getAllSolutionsForAdmin } from '@/lib/db';
import AdminSolutionList from '@/components/AdminSolutionList';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = {
  title: 'Admin Dashboard | CSES Solver Blogs',
  description: 'Manage submitted solutions.',
};

export default async function AdminPage() {
  const solutions = await getAllSolutionsForAdmin();

  return (
    <div className="py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">Admin Dashboard</h1>
        <p className="mt-3 text-lg text-muted-foreground">Manage and approve submitted solutions.</p>
      </div>
      {solutions.length === 0 ? (
        <Card className="text-center p-10">
          <CardTitle className="text-2xl font-semibold">No Solutions Submitted Yet</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Once users submit solutions, they will appear here for review.
          </CardDescription>
        </Card>
      ) : (
        <AdminSolutionList initialSolutions={solutions} />
      )}
    </div>
  );
}
