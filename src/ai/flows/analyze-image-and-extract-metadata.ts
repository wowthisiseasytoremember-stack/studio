'use server';

/**
 * @fileOverview Analyzes an image using Gemini and provides a valuation.
 *
 * - analyzeImageAndExtractMetadata - A function that handles the image analysis and valuation process.
 * - AnalyzeImageAndExtractMetadataInput - The input type for the analyzeImageAndExtractMetadata function.
 * - AnalyzeImageAndExtractMetadataOutput - The return type for the analyzeImageAndExtractMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageAndExtractMetadataInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeImageAndExtractMetadataInput = z.infer<typeof AnalyzeImageAndExtractMetadataInputSchema>;

const AnalyzeImageAndExtractMetadataOutputSchema = z.object({
    descriptiveName: z.string().describe("A short, descriptive name for the item."),
    valuation: z.string().describe("A concise summary of the item's potential value (e.g., 'Potentially valuable', 'Collector\'s item', 'Low value')."),
    reasoning: z.string().describe("A brief explanation for the valuation."),
    tags: z.array(z.string()).describe("An array of 3-5 relevant keywords or tags."),
    otherMetadata: z.record(z.string(), z.any()).describe('An object containing any other interesting metadata extracted from the image (e.g., material, period, condition).'),
}).describe('The extracted metadata and valuation for the item in the image.');
export type AnalyzeImageAndExtractMetadataOutput = z.infer<typeof AnalyzeImageAndExtractMetadataOutputSchema>;


export async function analyzeImageAndExtractMetadata(input: AnalyzeImageAndExtractMetadataInput): Promise<AnalyzeImageAndExtractMetadataOutput> {
  return analyzeImageAndExtractMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImageAndExtractMetadataPrompt',
  input: {schema: AnalyzeImageAndExtractMetadataInputSchema},
  output: {schema: AnalyzeImageAndExtractMetadataOutputSchema},
  prompt: `You are an expert appraiser for a high-end auction house. Your goal is to determine if the item in the image is valuable and why.
Analyze the image and provide a concise valuation and the reasoning behind it. Also, provide a descriptive name for the item and some relevant tags.

Image: {{media url=photoDataUri}}`,
});

const analyzeImageAndExtractMetadataFlow = ai.defineFlow(
  {
    name: 'analyzeImageAndExtractMetadataFlow',
    inputSchema: AnalyzeImageAndExtractMetadataInputSchema,
    outputSchema: AnalyzeImageAndExtractMetadataOutputSchema,
  },
  async input => {
    const response = await prompt(input);
    const output = response.output;
    if (!output) {
      throw new Error('AI failed to return valid analysis.');
    }
    return output;
  }
);
