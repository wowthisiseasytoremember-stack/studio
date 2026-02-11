'use server';

/**
 * @fileOverview Analyzes an image using Gemini 1.5 Pro and extracts relevant metadata.
 *
 * - analyzeImageAndExtractMetadata - A function that handles the image analysis and metadata extraction process.
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
  metadata: z.record(z.string(), z.any()).describe('The extracted metadata from the image.'),
});
export type AnalyzeImageAndExtractMetadataOutput = z.infer<typeof AnalyzeImageAndExtractMetadataOutputSchema>;

export async function analyzeImageAndExtractMetadata(input: AnalyzeImageAndExtractMetadataInput): Promise<AnalyzeImageAndExtractMetadataOutput> {
  return analyzeImageAndExtractMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImageAndExtractMetadataPrompt',
  input: {schema: AnalyzeImageAndExtractMetadataInputSchema},
  // output: {schema: AnalyzeImageAndExtractMetadataOutputSchema}, // Removed to avoid schema validation issues.
  prompt: `You are an expert AI model specializing in analyzing images and extracting relevant metadata. Analyze the image and extract all relevant metadata in JSON format.
Your output must be only the raw JSON object, without any surrounding text or markdown.

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
    const textOutput = response.text;
    try {
      // The model may still wrap the output in markdown, so we clean it.
      const jsonText = textOutput.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      const metadata = JSON.parse(jsonText);
      return {metadata};
    } catch (e) {
      console.error('Failed to parse metadata JSON. Raw output:', textOutput, e);
      throw new Error('AI failed to return valid JSON metadata.');
    }
  }
);
