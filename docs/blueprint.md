# **App Name**: Insight Store

## Core Features:

- File Upload Trigger: Triggers a Cloud Function upon uploading an image or CSV to Firebase Storage.
- Gemini 1.5 Pro Integration: Sends the uploaded image to the Gemini 1.5 Pro model for analysis and metadata extraction.
- Metadata Extraction: Receives structured JSON metadata from Gemini 1.5 Pro describing the contents of the image.
- Firestore Storage: Stores the extracted metadata in a Firestore database for further analysis.
- Embedding Generation: Generates embeddings for the image and the corresponding metadata. This feature uses an AI tool.
- Similarity Search: Checks for similar documents based on the generated embeddings in the Firestore.
- Suggested Bundle IDs: Adds a 'suggested_bundle_ids' field to the Firestore document, indicating similar documents.

## Style Guidelines:

- Primary color: Dark gray (#333333) for a comfortable viewing experience in dark mode.
- Background color: Black (#000000) to minimize eye strain.
- Accent color: A muted orange (#FFAB40) to draw attention to important UI elements without being too harsh.
- Headline Font: 'Space Grotesk' sans-serif font for a techy and modern feel (headline).
- Body Font: 'Inter' sans-serif font to complement Space Grotesk in a readable way.
- Simple, line-based icons to represent different types of data and actions.
- Clean, card-based layout for displaying metadata and suggested bundle IDs.