'use client';

import type { Solution, SolutionSection } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ExternalLink,
  Lightbulb,
  Code2,
  Sigma,
  ListChecks,
  Tag,
  CalendarDays,
  User,
  BookOpen,
  Wand2,
  Loader2,
  FilePenLine,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { summarizeTextAction, updateSolutionSectionsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface SolutionDisplayProps {
  solution: Solution;
}

export function SolutionDisplay({ solution: initialSolution }: SolutionDisplayProps) {
  const [solution, setSolution] = useState(initialSolution);
  const [summarizedContent, setSummarizedContent] = useState<{ [sectionId: string]: string | { error: string } }>({});
  const [isSummarizing, setIsSummarizing] = useState<{ [sectionId: string]: boolean }>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const { toast } = useToast();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    setSolution(initialSolution);
  }, [initialSolution]);

  if (!solution.isApproved) {
    return (
      <Card className="w-full shadow-xl my-8">
        <CardHeader className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <CardTitle className="text-2xl font-bold mt-4">Solution Awaiting Approval</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            This solution is currently under review and not yet publicly visible.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild variant="outline">
            <Link href="/">Back to Problem List</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleSummarize = async (section: SolutionSection) => {
    setIsSummarizing((prev) => ({ ...prev, [section.id]: true }));
    const result = await summarizeTextAction(section.content);
    setSummarizedContent((prev) => ({ ...prev, [section.id]: result }));
    setIsSummarizing((prev) => ({ ...prev, [section.id]: false }));
    if (typeof result !== 'string' && result.error) {
      toast({ title: 'Summarization Error', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Summary Generated', description: 'AI summary is available for this section.' });
    }
  };

  const handleEditSection = (section: SolutionSection) => {
    setEditingSectionId(section.id);
    setEditText(section.content);
  };

  const handleSaveEdit = async () => {
    if (!editingSectionId) return;

    const updatedSolution = await updateSolutionSectionsAction(solution.id, editingSectionId, editText);

    if (updatedSolution) {
      setSolution(updatedSolution);
      toast({ title: 'Section Updated', description: 'Your changes have been saved.' });
      setEditingSectionId(null);
    } else {
      toast({ title: 'Update Failed', description: 'Could not save changes.', variant: 'destructive' });
    }
  };

  const renderSection = (section: SolutionSection) => {
    const summary = summarizedContent[section.id];
    const isLoadingSummary = isSummarizing[section.id];

    let content;
    switch (section.type) {
      case 'heading':
        content = <h2 className="text-2xl font-semibold mt-6 mb-3 text-primary">{section.content}</h2>;
        break;
      case 'paragraph':
        content = <p className="text-base leading-relaxed my-2">{section.content}</p>;
        break;
      case 'code':
        content = (
          <div className="my-4 rounded-md overflow-hidden shadow-md">
            {section.language && section.language !== 'plaintext' && (
              <div className="bg-muted text-muted-foreground px-4 py-1.5 text-xs font-medium">
                Language: {section.language}
              </div>
            )}
            <SyntaxHighlighter
              language={section.language || 'plaintext'}
              style={theme === 'dark' ? dracula : prism}
              customStyle={{ 
                borderRadius: '0.5rem', 
                padding: '1rem', 
                margin: 0,
                backgroundColor: theme === 'dark' ? '#282a36' : '#f5f5f5'
              }}
              wrapLines
              showLineNumbers
            >
              {section.content}
            </SyntaxHighlighter>
          </div>
        );
        break;
      case 'equation':
        content = (
          <div className="text-center p-3 my-4 border border-dashed border-accent rounded-md">
            <p className="font-mono text-accent-foreground text-lg">{section.content}</p>
          </div>
        );
        break;
      case 'hint':
        content = (
          <Alert variant="default" className="my-4 bg-accent/10 border-accent text-accent-foreground">
            <Lightbulb className="h-5 w-5 text-accent" />
            <AlertTitle className="font-semibold text-accent">Hint</AlertTitle>
            <AlertDescription>{section.content}</AlertDescription>
          </Alert>
        );
        break;
      default:
        content = <p>{section.content}</p>;
    }

    const canSummarize = ['paragraph', 'hint'].includes(section.type);

    return (
      <div key={section.id} className="relative group">
        {content}
        <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 space-x-1 bg-background/80 rounded-bl-md">
          {canSummarize && (
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSummarize(section)}
                  disabled={isLoadingSummary}
                  title="Summarize with AI"
                >
                  {isLoadingSummary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 text-primary" />
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Summary for Section</DialogTitle>
                </DialogHeader>
                {isLoadingSummary ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto my-4" />
                ) : summary && typeof summary === 'string' ? (
                  <p className="py-4">{summary}</p>
                ) : summary && typeof summary !== 'string' && summary.error ? (
                  <p className="text-destructive py-4">{summary.error}</p>
                ) : (
                  <p className="py-4 text-muted-foreground">Click "Summarize" or content will appear here.</p>
                )}
              </DialogContent>
            </Dialog>
          )}
          {['paragraph', 'hint', 'heading', 'code', 'equation'].includes(section.type) && (
            <Button variant="ghost" size="icon" onClick={() => handleEditSection(section)} title="Edit Section">
              <FilePenLine className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 p-6">
        <CardTitle className="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">{solution.title}</CardTitle>
        <CardDescription className="text-md text-muted-foreground mt-2">
          Solution for CSES Problem: <strong className="text-accent">{solution.problemId}</strong>
        </CardDescription>
        {solution.problemStatementLink && (
          <Button variant="link" asChild className="px-0 text-sm -ml-1">
            <Link href={solution.problemStatementLink} target="_blank" rel="noopener noreferrer">
              View Problem Statement <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span className="flex items-center">
            <User className="mr-1.5 h-3.5 w-3.5" /> {solution.author}
          </span>
          <span className="flex items-center">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Created: {new Date(solution.createdAt).toLocaleDateString()}
          </span>
          <span className="flex items-center">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" /> Updated: {new Date(solution.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <BookOpen className="mr-2 h-5 w-5 text-accent" /> Category
          </h3>
          <Badge variant="default" className="text-sm bg-accent text-accent-foreground">
            {solution.category}
          </Badge>
        </div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold flex items-center mb-2">
            <Tag className="mr-2 h-5 w-5 text-accent" /> Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {solution.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator className="my-8" />

        <div>
          <h3 className="text-2xl font-bold mb-4 flex items-center text-primary">
            <ListChecks className="mr-3 h-7 w-7" /> Solution Details
          </h3>
          {solution.sections.map(renderSection)}
        </div>
      </CardContent>

      <Dialog open={!!editingSectionId} onOpenChange={(open) => !open && setEditingSectionId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={10}
            className="my-4 font-mono text-sm"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setEditingSectionId(null)}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
