'use server';

/**
 * @fileOverview A flow to generate daily hustle ideas that could earn approximately $3 per day.
 *
 * - generateDailyHustleIdeas - A function that generates a list of potential tasks or activities for micro-earning opportunities.
 * - GenerateDailyHustleIdeasInput - The input type for the generateDailyHustleIdeas function.
 * - GenerateDailyHustleIdeasOutput - The return type for the generateDailyHustleIdeas function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateDailyHustleIdeasInputSchema = z.object({
  userSkills: z
    .string()
    .describe(
      'A comma-separated list of skills that the user possesses.  These skills should be used to tailor the earning ideas to the user.'
    ),
});
export type GenerateDailyHustleIdeasInput = z.infer<typeof GenerateDailyHustleIdeasInputSchema>;

const GenerateDailyHustleIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe(
      'A list of potential tasks or activities that could earn approximately $3 per day.'
    ),
});
export type GenerateDailyHustleIdeasOutput = z.infer<typeof GenerateDailyHustleIdeasOutputSchema>;

export async function generateDailyHustleIdeas(
  input: GenerateDailyHustleIdeasInput
): Promise<GenerateDailyHustleIdeasOutput> {
  return generateDailyHustleIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyHustleIdeasPrompt',
  input: {
    schema: z.object({
      userSkills: z
        .string()
        .describe(
          'A comma-separated list of skills that the user possesses.  These skills should be used to tailor the earning ideas to the user.'
        ),
    }),
  },
  output: {
    schema: z.object({
      ideas: z
        .array(z.string())
        .describe(
          'A list of potential tasks or activities that could earn approximately $3 per day.'
        ),
    }),
  },
  prompt: `You are a creative AI assistant that helps users brainstorm ideas for earning small amounts of money, around $3 per day.

Given the user's skills, suggest tasks or activities that they could do to achieve this goal. Provide at least 5 ideas.

Skills: {{{userSkills}}}

Ideas:`,
});

const generateDailyHustleIdeasFlow = ai.defineFlow<
  typeof GenerateDailyHustleIdeasInputSchema,
  typeof GenerateDailyHustleIdeasOutputSchema
>({
  name: 'generateDailyHustleIdeasFlow',
  inputSchema: GenerateDailyHustleIdeasInputSchema,
  outputSchema: GenerateDailyHustleIdeasOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});