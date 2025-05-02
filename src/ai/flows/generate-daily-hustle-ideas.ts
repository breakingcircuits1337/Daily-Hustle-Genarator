
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
// Removed: import { getSites } from '@genkit-ai/web-loader'; // Corrected package name if needed

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
  suggestedWebsites: z.array(z.string().url()).describe('A list of relevant website URLs suggested for the idea.'), // Keep .url() here for the exported type and flow output validation
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
  // Add basic validation or error handling if needed before calling the flow
  try {
    const result = await generateDailyHustleIdeasFlow(input);
    // Optionally validate the result against GenerateDailyHustleIdeasOutputSchema here if needed
    return result;
  } catch (error) {
    console.error("Error in generateDailyHustleIdeas flow:", error);
    // Re-throw or return a specific error structure
    throw new Error("Failed to generate hustle ideas.");
  }
}

// Define a simpler schema specifically for the prompt output, removing .url()
const PromptOutputIdeaSchema = z.object({
  idea: z.string().describe('A specific task or activity suggested for earning money.'),
  suggestedWebsites: z.array(z.string()).describe('A list of relevant website URLs suggested for the idea.'), // Removed .url() here
});

const PromptOutputSchema = z.object({
  ideas: z
    .array(PromptOutputIdeaSchema)
    .describe(
      'A list of potential tasks or activities, each with suggested websites, that could earn approximately the target amount per day.'
    ),
});


const prompt = ai.definePrompt({
  name: 'generateDailyHustleIdeasPrompt',
  input: {
    schema: GenerateDailyHustleIdeasInputSchema, // Use the input schema directly
  },
  output: {
     schema: PromptOutputSchema, // Use the simpler schema without .url() for the AI output
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
  typeof GenerateDailyHustleIdeasOutputSchema // Flow still returns the type with .url() validation
>({
  name: 'generateDailyHustleIdeasFlow',
  inputSchema: GenerateDailyHustleIdeasInputSchema,
  outputSchema: GenerateDailyHustleIdeasOutputSchema, // Output schema for the flow includes .url()
},
async input => {
  const {output} = await prompt(input); // Calls the prompt with the simpler output schema

  // Ensure output exists and matches the expected structure before returning
  if (!output || !output.ideas) {
     console.warn("Prompt returned null or undefined output. Returning empty ideas list.");
     return { ideas: [] };
  }

  // Although the prompt output schema doesn't enforce .url(), the flow's output schema does.
  // Zod will validate this return value against GenerateDailyHustleIdeasOutputSchema.
  // If the AI returns invalid URLs, Zod will throw an error here.
  return output;
});
