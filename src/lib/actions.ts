
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
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const solutionSectionSchema = z.object({
  id: z.string().optional(), // ID might not be present on creation, but will be on update
  type: z.enum(['heading', 'paragraph', 'code', 'equation', 'hint']),
  content: z.string().min(1, "Section content cannot be empty."),
  language: z.string().optional(), 
});

const solutionSubmissionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long."),
  problemId: z.string().min(1, "Problem ID/Name is required."),
  problemStatementLink: z.string().url({message: "Invalid URL format."}).optional().or(z.literal('')),
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
    sections: parsedSections.map((s: any) => ({
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

// Admin Authentication Actions
const ADMIN_AUTH_COOKIE_NAME = 'admin_auth_token';

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function loginAdminAction(credentials: z.infer<typeof loginSchema>): Promise<{ success: boolean; error?: string }> {
  const validatedCredentials = loginSchema.safeParse(credentials);
  if (!validatedCredentials.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { username, password } = validatedCredentials.data;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD environment variables are not set.');
    return { success: false, error: 'Server configuration error.' };
  }

  if (username === adminUsername && password === adminPassword) {
    cookies().set(ADMIN_AUTH_COOKIE_NAME, 'true', { // Simple token value
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/admin', // Scope cookie to admin paths
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });
    return { success: true };
  } else {
    return { success: false, error: 'Invalid username or password.' };
  }
}

export async function logoutAdminAction(): Promise<{ success: boolean }> {
  cookies().delete(ADMIN_AUTH_COOKIE_NAME);
  // No need to revalidatePath here, client will redirect
  return { success: true };
}
