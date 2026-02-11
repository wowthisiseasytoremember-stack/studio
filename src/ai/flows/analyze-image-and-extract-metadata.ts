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
    estimatedValueRange: z.object({
        low: z.string().describe("The low-end of the estimated sale price as a formatted string (e.g., '$100')."),
        high: z.string().describe("The high-end of the estimated sale price as a formatted string (e.g., '$250')."),
    }).describe("The estimated sale price range for the item."),
    reasoning: z.string().describe("A detailed explanation for the valuation, including factors like condition, rarity, and demand."),
    comparableSales: z.array(z.object({
        description: z.string().describe("A brief description of a similar item that was sold."),
        price: z.string().describe("The price the comparable item sold for, as a formatted string (e.g., '$150')."),
    })).describe("An array of 1-3 examples of comparable sales to support the valuation."),
    tags: z.array(z.string()).describe("An array of 3-5 relevant keywords or tags for marketplace listings."),
    otherMetadata: z.array(z.object({
        key: z.string().describe("The name of the metadata field (e.g., 'Material', 'Period', 'Condition')."),
        value: z.string().describe("The value of the metadata field."),
    })).describe('An array of key-value pairs for any other interesting metadata extracted from the image.'),
}).describe('The extracted metadata and valuation for the item in the image.');
export type AnalyzeImageAndExtractMetadataOutput = z.infer<typeof AnalyzeImageAndExtractMetadataOutputSchema>;


export async function analyzeImageAndExtractMetadata(input: AnalyzeImageAndExtractMetadataInput): Promise<AnalyzeImageAndExtractMetadataOutput> {
  return analyzeImageAndExtractMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeImageAndExtractMetadataPrompt',
  input: {schema: AnalyzeImageAndExtractMetadataInputSchema},
  output: {schema: AnalyzeImageAndExtractMetadataOutputSchema},
  prompt: `You are an expert appraiser for a high-end auction house. Your goal is to determine the value of the item in the image for the purpose of selling it online.

Analyze the image and provide the following:
1.  A short, descriptive name suitable for a listing title.
2.  An estimated sale price range, with a low and high end (e.g., $100 - $150).
3.  A detailed reasoning for your valuation. Consider the item's apparent condition, rarity, brand, and current market demand. Be specific.
4.  One to three examples of comparable sales, including a brief description and the price it sold for.
5.  A list of 3-5 relevant tags to help buyers find this item in a marketplace.
6.  Any other interesting metadata you can extract (e.g., Material, Period, Style, Condition).

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
