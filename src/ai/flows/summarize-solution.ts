// SummarizeSolution.ts
'use server';

/**
 * @fileOverview Summarizes a section of a solution using generative AI.
 *
 * - summarizeSolution - A function that takes a section of a solution and returns a summary.
 * - SummarizeSolutionInput - The input type for the summarizeSolution function.
 * - SummarizeSolutionOutput - The return type for the summarizeSolution function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSolutionInputSchema = z.object({
  solutionSection: z
    .string()
    .describe('The section of the solution to be summarized.'),
});
export type SummarizeSolutionInput = z.infer<typeof SummarizeSolutionInputSchema>;

const SummarizeSolutionOutputSchema = z.object({
  summary: z.string().describe('The summarized section of the solution.'),
});
export type SummarizeSolutionOutput = z.infer<typeof SummarizeSolutionOutputSchema>;

export async function summarizeSolution(input: SummarizeSolutionInput): Promise<SummarizeSolutionOutput> {
  return summarizeSolutionFlow(input);
}

const summarizeSolutionPrompt = ai.definePrompt({
  name: 'summarizeSolutionPrompt',
  input: {schema: SummarizeSolutionInputSchema},
  output: {schema: SummarizeSolutionOutputSchema},
  prompt: `Summarize the following solution section in a concise manner:\n\n{{{solutionSection}}}`,
});

const summarizeSolutionFlow = ai.defineFlow(
  {
    name: 'summarizeSolutionFlow',
    inputSchema: SummarizeSolutionInputSchema,
    outputSchema: SummarizeSolutionOutputSchema,
  },
  async input => {
    const {output} = await summarizeSolutionPrompt(input);
    return output!;
  }
);
