// src/ai/flows/suggest-tags-categories.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest relevant tags and categories
 * for a user-submitted solution based on its content.
 *
 * - suggestTagsCategories - A function that takes the solution content as input and returns suggested tags and categories.
 * - SuggestTagsCategoriesInput - The input type for the suggestTagsCategories function.
 * - SuggestTagsCategoriesOutput - The return type for the suggestTagsCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTagsCategoriesInputSchema = z.object({
  solutionContent: z.string().describe('The content of the solution for a CSES problem.'),
});
export type SuggestTagsCategoriesInput = z.infer<typeof SuggestTagsCategoriesInputSchema>;

const SuggestTagsCategoriesOutputSchema = z.object({
  tags: z.array(z.string()).describe('Suggested tags for the solution.'),
  categories: z.array(z.string()).describe('Suggested categories for the solution.'),
});
export type SuggestTagsCategoriesOutput = z.infer<typeof SuggestTagsCategoriesOutputSchema>;

export async function suggestTagsCategories(input: SuggestTagsCategoriesInput): Promise<SuggestTagsCategoriesOutput> {
  return suggestTagsCategoriesFlow(input);
}

const suggestTagsCategoriesPrompt = ai.definePrompt({
  name: 'suggestTagsCategoriesPrompt',
  input: {schema: SuggestTagsCategoriesInputSchema},
  output: {schema: SuggestTagsCategoriesOutputSchema},
  prompt: `You are an expert in categorizing solutions for CSES problems.
  Given the content of a solution, suggest relevant tags and categories that would help users find the solution.
  Return the tags and categories as a JSON object.

  Solution Content:
  {{solutionContent}}`,
});

const suggestTagsCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestTagsCategoriesFlow',
    inputSchema: SuggestTagsCategoriesInputSchema,
    outputSchema: SuggestTagsCategoriesOutputSchema,
  },
  async input => {
    const {output} = await suggestTagsCategoriesPrompt(input);
    return output!;
  }
);
