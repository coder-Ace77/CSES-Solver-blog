
'use client';

import type { Solution } from '@/lib/types';
import { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react';
import { toggleSolutionApprovalAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AdminSolutionListProps {
  initialSolutions: Solution[];
}

export default function AdminSolutionList({ initialSolutions }: AdminSolutionListProps) {
  const [solutions, setSolutions] = useState<Solution[]>(initialSolutions);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    setSolutions(initialSolutions);
  }, [initialSolutions]);

  const handleToggleApproval = (solutionId: string) => {
    startTransition(async () => {
      const result = await toggleSolutionApprovalAction(solutionId);
      if (result.success && typeof result.newStatus === 'boolean') {
        setSolutions(prevSolutions =>
          prevSolutions.map(s =>
            s.id === solutionId ? { ...s, isApproved: result.newStatus!, updatedAt: new Date().toISOString() } : s
          )
        );
        toast({
          title: 'Success',
          description: result.message,
        });
      } else if (result.success && typeof result.newStatus !== 'boolean') {
        // This case indicates an issue with the server action's response
        console.error("AdminSolutionList: Action succeeded but newStatus is not a boolean.", result);
        toast({
          title: 'Update Incomplete',
          description: 'Status might have updated on the server, but UI could not be synced. Please refresh.',
          variant: 'destructive',
        });
        // Consider a router.refresh() if this state is common, to pull fresh server data.
      }
      else { // result.success is false
        toast({
          title: 'Error',
          description: result.message || 'Failed to update solution status. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {solutions.map(solution => (
        <Card key={solution.id} className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl font-semibold text-primary">{solution.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Problem: {solution.problemId} | Submitted by: {solution.author}
                </CardDescription>
              </div>
              <Badge variant={solution.isApproved ? 'default' : 'secondary'} className="whitespace-nowrap">
                {solution.isApproved ? <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" /> : <XCircle className="mr-1.5 h-4 w-4 text-yellow-500" />}
                {solution.isApproved ? 'Approved' : 'Pending Approval'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(solution.createdAt).toLocaleString()} | Last Updated: {new Date(solution.updatedAt).toLocaleString()}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/problems/${solution.id}`} target="_blank">
                <Eye className="mr-2 h-4 w-4" /> View
              </Link>
            </Button>
            <Button
              size="sm"
              variant={solution.isApproved ? 'destructive' : 'default'}
              onClick={() => handleToggleApproval(solution.id)}
              disabled={isPending}
              className="w-32"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : solution.isApproved ? (
                <XCircle className="mr-2 h-4 w-4" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {isPending ? 'Processing...' : solution.isApproved ? 'Unapprove' : 'Approve'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
