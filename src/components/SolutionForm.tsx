'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Wand2, Loader2 } from 'lucide-react';
import type { SolutionSection, SolutionSectionType, SolutionSubmission } from '@/lib/types';
import { createSolutionAction, suggestTagsAndCategoryAction } from '@/lib/actions';
import { useFormState } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const sectionSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'code', 'equation', 'hint']),
  content: z.string().min(1, "Section content cannot be empty."),
});

const solutionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  problemId: z.string().min(1, "Problem ID/Name is required."),
  problemStatementLink: z.string().url({ message: "Invalid URL for problem statement link." }).optional().or(z.literal('')),
  sections: z.array(sectionSchema).min(1, "At least one section is required."),
  tags: z.string().min(1, "Tags are required."), // Will be comma-separated
  category: z.string().min(1, "Category is required."),
});

type SolutionFormData = z.infer<typeof solutionFormSchema>;

const initialFormState = { message: "", success: false, solutionId: undefined };

export function SolutionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [formState, formAction] = useFormState(createSolutionAction, initialFormState);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const { control, handleSubmit, register, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: {
      title: '',
      problemId: '',
      problemStatementLink: '',
      sections: [{ type: 'paragraph', content: '' }],
      tags: '',
      category: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections',
  });

  const watchedSections = watch('sections');
  const watchedTitle = watch('title');
  const watchedProblemId = watch('problemId');

  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Success!' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success && formState.solutionId) {
        reset(); // Reset form on successful submission
        router.push(`/problems/${formState.solutionId}`);
      }
    }
  }, [formState, toast, reset, router]);

  const handleSuggestTagsCategories = async () => {
    setIsAiLoading(true);
    const sectionsText = watchedSections.map(s => s.content).join('\n\n');
    const result = await suggestTagsAndCategoryAction({
      title: watchedTitle,
      problemId: watchedProblemId,
      sectionsText,
    });

    if ('error' in result) {
      toast({ title: 'AI Suggestion Error', description: result.error, variant: 'destructive' });
    } else {
      setValue('tags', result.tags.join(', '));
      if (result.categories.length > 0) {
        setValue('category', result.categories[0]); // Assuming single category for simplicity
      }
      toast({ title: 'AI Suggestions Applied', description: 'Tags and category have been populated.' });
    }
    setIsAiLoading(false);
  };
  
  const onSubmit = (data: SolutionFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('problemId', data.problemId);
    formData.append('problemStatementLink', data.problemStatementLink || '');
    formData.append('sections', JSON.stringify(data.sections)); // Stringify sections
    formData.append('tags', data.tags);
    formData.append('category', data.category);
    formAction(formData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">Submit New Solution</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="title" className="font-semibold">Blog Title</Label>
            <Input id="title" {...register('title')} placeholder="e.g., Efficient Solution for Two Sets" className="mt-1" />
            {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="problemId" className="font-semibold">CSES Problem ID/Name</Label>
            <Input id="problemId" {...register('problemId')} placeholder="e.g., Two Sets or 1092" className="mt-1" />
            {errors.problemId && <p className="text-sm text-destructive mt-1">{errors.problemId.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="problemStatementLink" className="font-semibold">Problem Statement Link (Optional)</Label>
            <Input id="problemStatementLink" {...register('problemStatementLink')} placeholder="https://cses.fi/problemset/task/..." className="mt-1" />
            {errors.problemStatementLink && <p className="text-sm text-destructive mt-1">{errors.problemStatementLink.message}</p>}
          </div>

          <div className="space-y-4">
            <Label className="font-semibold text-lg">Solution Sections</Label>
            {fields.map((field, index) => (
              <Card key={field.id} className="p-4 space-y-3 bg-secondary/50">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`sections.${index}.type`} className="font-medium">Section {index + 1}</Label>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive/80">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <Controller
                  control={control}
                  name={`sections.${index}.type`}
                  render={({ field: controllerField }) => (
                    <Select onValueChange={controllerField.onChange} defaultValue={controllerField.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select section type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="heading">Heading</SelectItem>
                        <SelectItem value="paragraph">Paragraph</SelectItem>
                        <SelectItem value="code">Code Snippet</SelectItem>
                        <SelectItem value="equation">Equation (Text)</SelectItem>
                        <SelectItem value="hint">Hint</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.sections?.[index]?.type && <p className="text-sm text-destructive mt-1">{errors.sections[index]?.type?.message}</p>}

                <Textarea
                  {...register(`sections.${index}.content`)}
                  placeholder={
                    watchedSections[index]?.type === 'code' ? 'Enter code snippet here...' :
                    watchedSections[index]?.type === 'heading' ? 'Enter heading text...' :
                    watchedSections[index]?.type === 'equation' ? 'Enter equation like E=mc^2 or LaTeX snippet...' :
                    'Enter content...'
                  }
                  rows={watchedSections[index]?.type === 'code' ? 8 : watchedSections[index]?.type === 'heading' ? 1 : 4}
                  className={`mt-1 ${watchedSections[index]?.type === 'code' || watchedSections[index]?.type === 'equation' ? 'font-mono text-sm' : ''}`}
                />
                {errors.sections?.[index]?.content && <p className="text-sm text-destructive mt-1">{errors.sections[index]?.content?.message}</p>}
              </Card>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ type: 'paragraph', content: '' })} className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Section
            </Button>
             {errors.sections && typeof errors.sections.message === 'string' && <p className="text-sm text-destructive mt-1">{errors.sections.message}</p>}
          </div>

          <div>
            <Label htmlFor="tags" className="font-semibold">Tags (comma-separated)</Label>
            <Input id="tags" {...register('tags')} placeholder="e.g., dynamic programming, greedy, graphs" className="mt-1" />
            {errors.tags && <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>}
          </div>

          <div>
            <Label htmlFor="category" className="font-semibold">Category</Label>
            <Input id="category" {...register('category')} placeholder="e.g., Algorithms, Data Structures" className="mt-1" />
            {errors.category && <p className="text-sm text-destructive mt-1">{errors.category.message}</p>}
          </div>
          
          <Button type="button" onClick={handleSuggestTagsCategories} variant="outline" className="w-full" disabled={isAiLoading || !watchedTitle || !watchedProblemId || watchedSections.length === 0}>
            {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Suggest Tags & Category (AI)
          </Button>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || isAiLoading}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Solution
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
