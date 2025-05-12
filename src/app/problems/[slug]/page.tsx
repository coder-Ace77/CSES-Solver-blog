
import { getSolutionById, getSolutions } from '@/lib/db';
import { SolutionDisplay } from '@/components/SolutionDisplay';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';


type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const solutions = await getSolutions(); // Only approved solutions for static generation
  return solutions.map(solution => ({
    slug: solution.id,
  }));
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const solution = await getSolutionById(params.slug);

  if (!solution) {
    return {
      title: 'Solution Not Found',
    };
  }
  
  // Metadata should be available even if pending approval, for admin viewing etc.
  // The content restriction is handled by the page component / SolutionDisplay.
  return {
    title: `${solution.title}${solution.isApproved ? '' : ' (Pending Approval)'} | CSES Solver Blogs`,
    description: `Solution for CSES problem: ${solution.problemId}. Category: ${solution.category}. Tags: ${solution.tags.join(', ')}.`,
  };
}

export default async function SolutionPage({ params }: Props) {
  const solution = await getSolutionById(params.slug);

  if (!solution) {
    notFound();
  }

  // The SolutionDisplay component itself will show an "awaiting approval" message if !solution.isApproved
  // No need for an explicit check here to redirect, as admins might want to view it via direct link.

  return (
    <div className="py-8">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Problem List
          </Link>
        </Button>
      </div>
      <SolutionDisplay solution={solution} />
    </div>
  );
}

