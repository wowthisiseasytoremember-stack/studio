import { config } from 'dotenv';
config();

import '@/ai/flows/find-similar-documents-using-embeddings.ts';
import '@/ai/flows/generate-embeddings-for-image-and-metadata.ts';
import '@/ai/flows/analyze-image-and-extract-metadata.ts';