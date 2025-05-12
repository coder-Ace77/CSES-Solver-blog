'use server';

import { z } from 'zod';
import { addSolution as dbAddSolution, updateSolution as dbUpdateSolution, getSolutionById as dbGetSolutionById } from '@/lib/db';
import type { Solution, SolutionSection, SolutionSubmission } from '@/lib/types';
import { summarizeSolution as aiSummarizeSolution } from '@/ai/flows/summarize-solution';
import { suggestTagsCategories as aiSuggestTagsCategories } from '@/ai/flows/suggest-tags-categories';
import { revalidatePath } from 'next/cache';

const solutionSubmissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  problemId: z.string().min(1, "Problem ID/Name is required."),
  problemStatementLink: z.string().url().optional().or(z.literal('')),
  sections: z.array(z.object({
    type: z.enum(['heading', 'paragraph', 'code', 'equation', 'hint']),
    content: z.string().min(1, "Section content cannot be empty."),
  })).min(1, "At least one section is required."),
  tags: z.string(), // Comma-separated
  category: z.string().min(1, "Category is required."),
});

export async function createSolutionAction(
  prevState: { message: string; success: boolean; solutionId?: string },
  formData: FormData
): Promise<{ message: string; success: boolean; solutionId?: string }> {
  const rawData = {
    title: formData.get('title'),
    problemId: formData.get('problemId'),
    problemStatementLink: formData.get('problemStatementLink'),
    tags: formData.get('tags'),
    category: formData.get('category'),
    sections: JSON.parse(formData.get('sections') as string || '[]') // sections are stringified JSON
  };
  
  const validatedFields = solutionSubmissionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      message: "Validation failed: " + validatedFields.error.flatten().fieldErrors ? JSON.stringify(validatedFields.error.flatten().fieldErrors) : "Unknown error",
      success: false,
    };
  }

  try {
    const newSolution = await dbAddSolution(validatedFields.data as SolutionSubmission);
    revalidatePath('/'); // Revalidate problem list page
    revalidatePath(`/problems/${newSolution.id}`); // Revalidate the new solution's page
    return { message: 'Solution submitted successfully!', success: true, solutionId: newSolution.id };
  } catch (error) {
    console.error("Error submitting solution:", error);
    return { message: 'Failed to submit solution.', success: false };
  }
}


export async function suggestTagsAndCategoryAction(solutionContent: {
  title: string;
  problemId: string;
  sectionsText: string;
}): Promise<{ tags: string[]; categories: string[] } | { error: string }> {
  if (!solutionContent.sectionsText.trim()) {
    return { error: "Cannot suggest for empty content." };
  }
  
  const fullContent = `Title: ${solutionContent.title}\nProblem: ${solutionContent.problemId}\n\n${solutionContent.sectionsText}`;

  try {
    const result = await aiSuggestTagsCategories({ solutionContent: fullContent });
    return result;
  } catch (e) {
    console.error("AI suggestion error:", e);
    return { error: 'Failed to get AI suggestions.' };
  }
}

export async function summarizeTextAction(textToSummarize: string): Promise<string | { error: string }> {
  if (!textToSummarize.trim()) {
    return { error: "Cannot summarize empty text." };
  }
  try {
    const result = await aiSummarizeSolution({ solutionSection: textToSummarize });
    return result.summary;
  } catch (e) {
    console.error("AI summarization error:", e);
    return { error: 'Failed to summarize text with AI.' };
  }
}

export async function updateSolutionSectionsAction(solutionId: string, sectionIdToUpdate: string, newContent: string): Promise<Solution | null> {
  const solution = await dbGetSolutionById(solutionId);
  if (!solution) return null;

  const updatedSections = solution.sections.map(section => 
    section.id === sectionIdToUpdate ? { ...section, content: newContent } : section
  );
  
  try {
    const updatedSolution = await dbUpdateSolution(solutionId, updatedSections);
    if (updatedSolution) {
      revalidatePath(`/problems/${solutionId}`);
      return updatedSolution;
    }
    return null;
  } catch (error) {
    console.error("Error updating solution section:", error);
    return null;
  }
}
