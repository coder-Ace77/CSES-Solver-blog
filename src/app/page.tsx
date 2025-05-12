
'use client';

import Link from 'next/link';
import { getSolutions } from '@/lib/db';
import type { Solution } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Tag, CalendarDays } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react'; // Import useEffect and useState

export default function ProblemListPage() {
  // Use state to hold solutions, fetch on client side
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchSolutions() {
      setIsLoading(true);
      try {
        const fetchedSolutions = await getSolutions(); // Fetches approved solutions
        setSolutions(fetchedSolutions);
      } catch (error) {
        console.error("Failed to fetch solutions:", error);
        // Handle error appropriately, maybe set an error state
      } finally {
        setIsLoading(false);
      }
    }
    fetchSolutions();
  }, []);

  const filteredSolutions = solutions.filter(solution =>
    solution.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solution.problemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solution.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    solution.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );


  if (isLoading) {
    // Optional: Add a loading skeleton or spinner
    return (
      <div className="space-y-8 py-8 text-center">
        <p>Loading solutions...</p>
      </div>
      );
  }


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

      <div className="max-w-md mx-auto mb-8">
        <Input
          placeholder="Search solutions by title, problem, category, or tag..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {filteredSolutions.length === 0 ? (
        <Card className="text-center p-10">
          <CardTitle className="text-2xl font-semibold">
            {solutions.length === 0 ? 'No Approved Solutions Yet' : 'No Solutions Found'}
          </CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
             {solutions.length === 0 ? 'Check back later or submit your own solution! Approved solutions will appear here.' : 'Try adjusting your search term.'}
          </CardDescription>
           {solutions.length === 0 && (
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
                    fill // Use fill instead of layout
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Add sizes prop
                    style={{ objectFit: 'cover' }} // Use style prop for objectFit
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

