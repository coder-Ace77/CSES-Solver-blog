
import Link from 'next/link';
import { getSolutions } from '@/lib/db';
import type { Solution } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Tag, CalendarDays } from 'lucide-react';
import Image from 'next/image';

export default async function ProblemListPage() {
  const solutions = await getSolutions(); // This now only fetches approved solutions

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          CSES Problem Solutions
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground sm:mt-6">
          Explore expertly crafted solutions for CSES problems. Enhance your understanding and coding skills.
        </p>
      </div>

      {solutions.length === 0 ? (
        <Card className="text-center p-10">
          <CardTitle className="text-2xl font-semibold">No Approved Solutions Yet</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Check back later or submit your own solution! Approved solutions will appear here.
          </CardDescription>
          <Button asChild className="mt-6">
            <Link href="/submit">Submit a Solution</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map((solution: Solution) => (
            <Card key={solution.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
              <CardHeader className="p-4">
                <div className="aspect-[16/9] relative w-full overflow-hidden rounded-md">
                   <Image 
                    src={`https://picsum.photos/seed/${solution.id}/400/225`} 
                    alt={solution.title} 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="abstract code"
                    className="rounded-md"
                  />
                </div>
                <CardTitle className="mt-4 text-xl font-semibold text-primary hover:underline">
                  <Link href={`/problems/${solution.id}`}>{solution.title}</Link>
                </CardTitle>
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                  For CSES Problem: {solution.problemId}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-4 space-y-2">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                  <span>{new Date(solution.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Tag className="mr-1.5 h-3.5 w-3.5" />
                  <span>{solution.category}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {solution.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/problems/${solution.id}`}>
                    View Solution <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

