
'use server';

/**
 * @fileOverview A flow to generate daily hustle ideas based on a target earning amount and suggest relevant websites.
 *
 * - generateDailyHustleIdeas - A function that generates a list of potential tasks or activities and suggested websites.
 * - GenerateDailyHustleIdeasInput - The input type for the generateDailyHustleIdeas function.
 * - GenerateDailyHustleIdeasOutput - The return type for the generateDailyHustleIdeas function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
// Removed: import { getSites } from '@genkit-ai/web-loader';

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

const IdeaWithWebsitesSchema = z.object({
  idea: z.string().describe('A specific task or activity suggested for earning money.'),
  suggestedWebsites: z.array(z.string().url()).describe('A list of relevant website URLs suggested for the idea.'), // Ensure URLs are valid
});

const GenerateDailyHustleIdeasOutputSchema = z.object({
  ideas: z
    .array(IdeaWithWebsitesSchema)
    .describe(
      'A list of potential tasks or activities, each with suggested websites, that could earn approximately the target amount per day.'
    ),
});
export type GenerateDailyHustleIdeasOutput = z.infer<typeof GenerateDailyHustleIdeasOutputSchema>;


// Removed the findRelevantWebsites tool definition


export async function generateDailyHustleIdeas(
  input: GenerateDailyHustleIdeasInput
): Promise<GenerateDailyHustleIdeasOutput> {
  return generateDailyHustleIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDailyHustleIdeasPrompt',
  input: {
    schema: GenerateDailyHustleIdeasInputSchema, // Use the input schema directly
  },
  output: {
     schema: GenerateDailyHustleIdeasOutputSchema, // Use the existing output schema
  },
  // Removed the tools array
  prompt: `You are a creative AI assistant that helps users brainstorm ideas for earning small amounts of money and find relevant online platforms or resources.

Given the user's skills and their target daily earning amount, suggest tasks or activities that they could do to achieve this goal. Provide at least 5 distinct ideas. The target amount is approximately \${{{targetAmount}}} per day.

For each idea you generate, suggest 2-3 relevant websites (like job boards, freelance platforms, marketplaces, informational sites) where the user might find opportunities or resources related to that specific idea, based on your knowledge. Ensure the websites are valid URLs.

Present the final output as a list of objects, where each object contains the 'idea' (string) and 'suggestedWebsites' (array of URL strings).

User Skills: {{{userSkills}}}
Target Daily Earning: \${{{targetAmount}}}

Generate the ideas and suggest websites now.`,
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
  // Ensure output matches the schema, provide a default empty array if null/undefined
  return output ?? { ideas: [] };
});
