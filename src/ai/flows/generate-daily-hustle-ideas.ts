'use server';

/**
 * @fileOverview A flow to generate daily hustle ideas based on a target earning amount.
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
      'A comma-separated list of skills that the user possesses. These skills should be used to tailor the earning ideas to the user.'
    ),
  targetAmount: z
    .number()
    .positive()
    .describe('The target amount of money the user wants to earn per day (e.g., 3 for $3).'),
});
export type GenerateDailyHustleIdeasInput = z.infer<typeof GenerateDailyHustleIdeasInputSchema>;

const GenerateDailyHustleIdeasOutputSchema = z.object({
  ideas: z
    .array(z.string())
    .describe(
      'A list of potential tasks or activities that could earn approximately the target amount per day.'
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
          'A comma-separated list of skills that the user possesses. These skills should be used to tailor the earning ideas to the user.'
        ),
       targetAmount: z
        .number()
        .positive()
        .describe('The target amount of money the user wants to earn per day (e.g., 3 for $3).'),
    }),
  },
  output: {
    schema: z.object({
      ideas: z
        .array(z.string())
        .describe(
          'A list of potential tasks or activities that could earn approximately the target amount per day.'
        ),
    }),
  },
  prompt: `You are a creative AI assistant that helps users brainstorm ideas for earning small amounts of money.

Given the user's skills and their target daily earning amount, suggest tasks or activities that they could do to achieve this goal. Provide at least 5 ideas. The target amount is approximately \${{{targetAmount}}} per day.

Skills: {{{userSkills}}}
Target Daily Earning: \${{{targetAmount}}}

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
