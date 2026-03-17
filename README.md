# Brochify

AI-Powered University Brochure Builder.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:

   ```env
   OPENROUTER_API_KEY=your_key
   NEXT_PUBLIC_FAL_API_KEY=your_key
   ```

3. Run development server:
   ```bash
   npm run dev
   ```

## Folder Structure

- `/app`: Pages and global styles
- `/components/Brochure`: A4 Landscape components
- `/components/Editor`: AI Chat and Logo tools
- `/lib`: API utilities and PDF engine
