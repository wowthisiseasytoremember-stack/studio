'use server';

/**
 * @fileOverview A flow to suggest product bundles from an inventory of items.
 *
 * - findBundlesInInventory - A function that takes a list of items and suggests bundles.
 * - FindBundlesInInventoryInput - The input type for the findBundlesInInventory function.
 * - FindBundlesInInventoryOutput - The return type for the findBundlesInInventory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeImageAndExtractMetadataOutputSchemaForBundle = z.object({
    descriptiveName: z.string().describe("A short, descriptive name for the item."),
    valuation: z.string().describe("A concise summary of the item's potential value (e.g., 'Potentially valuable', 'Collector\'s item', 'Low value')."),
    reasoning: z.string().describe("A brief explanation for the valuation."),
    tags: z.array(z.string()).describe("An array of 3-5 relevant keywords or tags."),
    otherMetadata: z.array(z.object({
        key: z.string().describe("The name of the metadata field (e.g., 'Material', 'Period', 'Condition')."),
        value: z.string().describe("The value of the metadata field."),
    })).describe('An array of key-value pairs for any other interesting metadata extracted from the image.'),
});

const FindBundlesInInventoryInputSchema = z.array(AnalyzeImageAndExtractMetadataOutputSchemaForBundle);

export type FindBundlesInInventoryInput = z.infer<typeof FindBundlesInInventoryInputSchema>;

const FindBundlesInInventoryOutputSchema = z.array(z.object({
  bundleName: z.string().describe("A catchy, short name for the suggested bundle."),
  description: z.string().describe("A compelling description of why these items make a great bundle for customers."),
  itemNames: z.array(z.string()).describe("The 'descriptiveName' of the items that should be included in this bundle."),
})).describe("An array of suggested product bundles.");

export type FindBundlesInInventoryOutput = z.infer<typeof FindBundlesInInventoryOutputSchema>;

export async function findBundlesInInventory(input: FindBundlesInInventoryInput): Promise<FindBundlesInInventoryOutput> {
  return findBundlesInInventoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findBundlesInInventoryPrompt',
  input: {schema: FindBundlesInInventoryInputSchema},
  output: {schema: FindBundlesInInventoryOutputSchema},
  prompt: `You are a master merchandiser and sales strategist for an online marketplace.
You have been given a list of items from a seller's inventory. Your task is to identify and suggest compelling product bundles that are likely to increase the average order value.

Analyze the following inventory. Focus on items that are thematically related, complementary, or could be marketed together to create a more attractive offer than selling them individually.

For each bundle you suggest, provide a catchy name, a description of why the items work well together, and the exact names of the items to include. Only suggest bundles with 2 or more items.

Here is the list of available items:
{{#each this}}
- Item: {{this.descriptiveName}}
  - Valuation: {{this.valuation}}
  - Reasoning: {{this.reasoning}}
  - Tags: {{#each this.tags}}{{this}}, {{/each}}
{{/each}}
`,
});

const findBundlesInInventoryFlow = ai.defineFlow(
  {
    name: 'findBundlesInInventoryFlow',
    inputSchema: FindBundlesInInventoryInputSchema,
    outputSchema: FindBundlesInInventoryOutputSchema,
  },
  async (inventory) => {
    if (inventory.length < 2) {
      return [];
    }
    
    const response = await prompt(inventory);
    const output = response.output;
    if (!output) {
      throw new Error('AI failed to return valid bundle suggestions.');
    }
    return output;
  }
);
