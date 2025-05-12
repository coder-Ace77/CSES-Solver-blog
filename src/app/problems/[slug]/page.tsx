import { getSolutionById, getSolutions } from '@/lib/db';
import { SolutionDisplay } from '@/components/SolutionDisplay';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

type Props = {
  params: { slug: string };
};

export async function generateStaticParams() {
  const solutions = await getSolutions();
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

  return {
    title: `${solution.title} | CSES Solver Blogs`,
    description: `Solution for CSES problem: ${solution.problemId}. Category: ${solution.category}. Tags: ${solution.tags.join(', ')}.`,
  };
}

export default async function SolutionPage({ params }: Props) {
  const solution = await getSolutionById(params.slug);

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
