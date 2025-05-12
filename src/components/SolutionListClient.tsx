
'use client';

import Link from 'next/link';
import type { Solution } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Tag, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react'; // Import useMemo for efficient filtering

interface SolutionListClientProps {
  initialSolutions: Solution[];
  fetchError: string | null;
}

export default function SolutionListClient({ initialSolutions, fetchError }: SolutionListClientProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Use useMemo to recalculate filteredSolutions only when searchTerm or initialSolutions changes
  const filteredSolutions = useMemo(() => {
    if (!initialSolutions) return [];
    return initialSolutions.filter(solution =>
      solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.problemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solution.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [searchTerm, initialSolutions]);

  if (fetchError) {
      return (
        <Card className="text-center p-10 bg-destructive/10 border-destructive">
            <CardTitle className="text-2xl font-semibold text-destructive">Error Loading Solutions</CardTitle>
            <CardDescription className="mt-2 text-destructive">{fetchError}</CardDescription>
        </Card>
      );
  }

  return (
    <>
      <div className="max-w-md mx-auto mb-8">
        <Input
          placeholder="Search solutions by title, problem, category, or tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
          aria-label="Search solutions"
        />
      </div>

      {filteredSolutions.length === 0 ? (
        <Card className="text-center p-10">
          <CardTitle className="text-2xl font-semibold">
            {initialSolutions.length === 0 ? 'No Approved Solutions Yet' : 'No Solutions Found'}
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
             {initialSolutions.length === 0 ? 'Check back later or submit your own solution! Approved solutions will appear here.' : 'Try adjusting your search term.'}
          </CardDescription>
           {initialSolutions.length === 0 && (
             <Button asChild className="mt-6">
               <Link href="/submit">Submit a Solution</Link>
             </Button>
           )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSolutions.map((solution: Solution) => (
            <Card key={solution.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
              <CardHeader className="p-4">
                <div className="aspect-[16/9] relative w-full overflow-hidden rounded-md">
                   <Image
                    src={`https://picsum.photos/seed/${solution.id}/400/225`}
                    alt={solution.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'cover' }}
                    data-ai-hint="abstract code"
                    className="rounded-md"
                    priority={false} // Non-critical image
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
                   {solution.tags.length > 3 && (
                     <Badge variant="outline" className="text-xs">...</Badge>
                   )}
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
    </>
  );
}
