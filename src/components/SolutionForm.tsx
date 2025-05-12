
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
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import type { SolutionSection, SolutionSectionType, SolutionSubmission } from '@/lib/types';
import { createSolutionAction } from '@/lib/actions';
import { useFormState } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const sectionSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'code', 'equation', 'hint']),
  content: z.string().min(1, "Section content cannot be empty."),
  language: z.string().optional(), // Optional language for code snippets
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

const popularLanguages = [
  { value: 'plaintext', label: 'Plain Text' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'go', label: 'Go' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
];


export function SolutionForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [formState, formAction] = useFormState(createSolutionAction, initialFormState);

  const { control, handleSubmit, register, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<SolutionFormData>({
    resolver: zodResolver(solutionFormSchema),
    defaultValues: {
      title: '',
      problemId: '',
      problemStatementLink: '',
      sections: [{ type: 'paragraph', content: '', language: undefined }],
      tags: '',
      category: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sections',
  });

  const watchedSections = watch('sections');

  useEffect(() => {
    if (formState.message) {
      toast({
        title: formState.success ? 'Success!' : 'Error',
        description: formState.message,
        variant: formState.success ? 'default' : 'destructive',
      });
      if (formState.success && formState.solutionId) {
        reset(); 
        router.push(`/problems/${formState.solutionId}`);
      }
    }
  }, [formState, toast, reset, router]);
  
  const onSubmit = (data: SolutionFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('problemId', data.problemId);
    formData.append('problemStatementLink', data.problemStatementLink || '');
    
    const sectionsWithPotentiallyUndefinedLanguage = data.sections.map(s => ({
      ...s,
      language: s.type === 'code' ? s.language || 'plaintext' : undefined,
    }));
    formData.append('sections', JSON.stringify(sectionsWithPotentiallyUndefinedLanguage));
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
                    <Select 
                      onValueChange={(value) => {
                        controllerField.onChange(value);
                        // Reset language if type is not code
                        if (value !== 'code') {
                          setValue(`sections.${index}.language`, undefined);
                        } else {
                           setValue(`sections.${index}.language`, 'plaintext'); // Default to plaintext
                        }
                      }} 
                      defaultValue={controllerField.value}
                    >
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
                
                {watchedSections[index]?.type === 'code' && (
                  <div className="mt-2">
                    <Label htmlFor={`sections.${index}.language`} className="font-medium">Code Language</Label>
                     <Controller
                        control={control}
                        name={`sections.${index}.language`}
                        defaultValue="plaintext"
                        render={({ field: controllerField }) => (
                          <Select onValueChange={controllerField.onChange} value={controllerField.value || 'plaintext'}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Select language (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {popularLanguages.map(lang => (
                                <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    {errors.sections?.[index]?.language && <p className="text-sm text-destructive mt-1">{errors.sections[index]?.language?.message}</p>}
                  </div>
                )}

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
            <Button type="button" variant="outline" onClick={() => append({ type: 'paragraph', content: '', language: undefined })} className="w-full">
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
          
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Solution
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

