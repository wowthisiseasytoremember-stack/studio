'use server';
/**
 * @fileOverview Flow to generate embeddings for an image and its metadata.
 *
 * - generateEmbeddingsForImageAndMetadata - A function that handles the generation of embeddings.
 * - GenerateEmbeddingsInput - The input type for the generateEmbeddingsForImageAndMetadata function.
 * - GenerateEmbeddingsOutput - The return type for the generateEmbeddingsForImageAndMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEmbeddingsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of something, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  metadata: z.string().describe('The metadata associated with the image.'),
});
export type GenerateEmbeddingsInput = z.infer<typeof GenerateEmbeddingsInputSchema>;

const GenerateEmbeddingsOutputSchema = z.object({
  imageEmbedding: z.array(z.number()).describe('The embedding for the image.'),
  metadataEmbedding: z.array(z.number()).describe('The embedding for the metadata.'),
});
export type GenerateEmbeddingsOutput = z.infer<typeof GenerateEmbeddingsOutputSchema>;

export async function generateEmbeddingsForImageAndMetadata(
  input: GenerateEmbeddingsInput
): Promise<GenerateEmbeddingsOutput> {
  return generateEmbeddingsFlow(input);
}

const imageEmbeddingPrompt = ai.definePrompt({
  name: 'imageEmbeddingPrompt',
  input: {schema: GenerateEmbeddingsInputSchema},
  output: {schema: z.array(z.number())},
  prompt: `Generate an embedding vector for the following image: {{media url=imageDataUri}}. The embedding should capture the visual features of the image.`,
});

const metadataEmbeddingPrompt = ai.definePrompt({
  name: 'metadataEmbeddingPrompt',
  input: {schema: GenerateEmbeddingsInputSchema},
  output: {schema: z.array(z.number())},
  prompt: `Generate an embedding vector for the following metadata: {{{metadata}}}. The embedding should capture the semantic meaning of the metadata.`,
});

const generateEmbeddingsFlow = ai.defineFlow(
  {
    name: 'generateEmbeddingsFlow',
    inputSchema: GenerateEmbeddingsInputSchema,
    outputSchema: GenerateEmbeddingsOutputSchema,
  },
  async input => {
    const [imageEmbeddingResponse, metadataEmbeddingResponse] = await Promise.all([
      imageEmbeddingPrompt(input),
      metadataEmbeddingPrompt(input),
    ]);

    return {
      imageEmbedding: imageEmbeddingResponse.output!,
      metadataEmbedding: metadataEmbeddingResponse.output!,
    };
  }
);
