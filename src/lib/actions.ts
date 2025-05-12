
'use server';

import { z } from 'zod';
import { 
  addSolution as dbAddSolution, 
  updateSolution as dbUpdateSolution, 
  getSolutionById as dbGetSolutionById,
  toggleSolutionApproval as dbToggleSolutionApproval
} from '@/lib/db';
import type { Solution, SolutionSection, SolutionSubmission } from '@/lib/types';
import { summarizeSolution as aiSummarizeSolution } from '@/ai/flows/summarize-solution';
// Removed: import { suggestTagsCategories as aiSuggestTagsCategories } from '@/ai/flows/suggest-tags-categories';
import { revalidatePath } from 'next/cache';

const solutionSectionSchema = z.object({
  type: z.enum(['heading', 'paragraph', 'code', 'equation', 'hint']),
  content: z.string().min(1, "Section content cannot be empty."),
  language: z.string().optional(), // For code snippets
});

const solutionSubmissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  problemId: z.string().min(1, "Problem ID/Name is required."),
  problemStatementLink: z.string().url().optional().or(z.literal('')),
  sections: z.array(solutionSectionSchema).min(1, "At least one section is required."),
  tags: z.string(), 
  category: z.string().min(1, "Category is required."),
});

export async function createSolutionAction(
  prevState: { message: string; success: boolean; solutionId?: string },
  formData: FormData
): Promise<{ message: string; success: boolean; solutionId?: string }> {
  const rawSections = formData.get('sections') as string;
  let parsedSections;
  try {
    parsedSections = JSON.parse(rawSections || '[]');
  } catch (e) {
    return { message: 'Invalid sections format.', success: false };
  }

  const rawData = {
    title: formData.get('title'),
    problemId: formData.get('problemId'),
    problemStatementLink: formData.get('problemStatementLink'),
    tags: formData.get('tags'),
    category: formData.get('category'),
    sections: parsedSections.map((s: any) => ({ // Type assertion for s
      type: s.type,
      content: s.content,
      language: s.type === 'code' ? s.language || 'plaintext' : undefined,
    })),
  };
  
  const validatedFields = solutionSubmissionSchema.safeParse(rawData);

  if (!validatedFields.success) {
    const errorDetails = validatedFields.error.flatten().fieldErrors;
    console.error("Validation failed:", errorDetails);
    return {
      message: "Validation failed: " + (Object.values(errorDetails).flat().join(', ') || "Unknown error"),
      success: false,
    };
  }

  try {
    const newSolution = await dbAddSolution(validatedFields.data as SolutionSubmission);
    revalidatePath('/'); 
    revalidatePath('/admin');
    revalidatePath(`/problems/${newSolution.id}`); 
    return { message: 'Solution submitted successfully! It is now awaiting admin approval.', success: true, solutionId: newSolution.id };
  } catch (error) {
    console.error("Error submitting solution:", error);
    return { message: 'Failed to submit solution.', success: false };
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
      revalidatePath('/admin');
      return updatedSolution;
    }
    return null;
  } catch (error) {
    console.error("Error updating solution section:", error);
    return null;
  }
}

export async function toggleSolutionApprovalAction(solutionId: string): Promise<{ success: boolean; message: string, newStatus?: boolean }> {
  try {
    const updatedSolution = await dbToggleSolutionApproval(solutionId);
    if (!updatedSolution) {
      return { success: false, message: "Solution not found." };
    }
    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath(`/problems/${solutionId}`);
    return { 
      success: true, 
      message: `Solution ${updatedSolution.isApproved ? 'approved' : 'unapproved'} successfully.`,
      newStatus: updatedSolution.isApproved 
    };
  } catch (error) {
    console.error("Error toggling solution approval:", error);
    return { success: false, message: "Failed to update approval status." };
  }
}

// Removed suggestTagsAndCategoryAction
// export async function suggestTagsAndCategoryAction(solutionContent: {
// title: string;
// problemId: string;
// sectionsText: string;
// }): Promise<{ tags: string[]; categories: string[] } | { error: string }> {
//   // ... implementation
// }
