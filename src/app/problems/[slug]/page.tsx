
import { getSolutionById, getSolutions } from '@/lib/db';
import { SolutionDisplay } from '@/components/SolutionDisplay';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';


type Props = {
  params: { slug: string }; // This type refers to the resolved shape of params.
                           // The runtime object might be treated as awaitable by Next.js.
};

export async function generateStaticParams() {
  const solutions = await getSolutions(); // Only approved solutions for static generation
  return solutions.map(solution => ({
    slug: solution.id,
  }));
}

export async function generateMetadata(
  { params }: Props, // params here is the destructured prop.
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Await the params object itself as per the Next.js error message.
  // If 'params' is not a Promise, 'await' will resolve it to itself.
  // If Next.js passes it in a way that requires awaiting, this handles it.
  const resolvedParams = await params; 
  const slug = resolvedParams.slug;
  const solution = await getSolutionById(slug);

  if (!solution) {
    return {
      title: 'Solution Not Found',
    };
  }
  
  return {
    title: `${solution.title}${solution.isApproved ? '' : ' (Pending Approval)'} | CSES Solver Blogs`,
    description: `Solution for CSES problem: ${solution.problemId}. Category: ${solution.category}. Tags: ${solution.tags.join(', ')}.`,
  };
}

export default async function SolutionPage({ params }: Props) {
  // Await the params object itself as per the Next.js error message.
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const solution = await getSolutionById(slug);

  if (!solution) {
    notFound();
  }

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
