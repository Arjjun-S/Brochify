import axios from 'axios';
import { logger } from './logger';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateBrochureData(prompt: string, history: any[] = [], retries = 2) {
  try {
    const formattedHistory = history.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.reasoning_details ? { reasoning_details: m.reasoning_details } : {})
    }));

    const response: any = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [
          {
            role: 'system',
            content: `You are an elite academic brochure architect. Your goal is to generate HIGH-DENSITY, PROFESSIONAL content for a 3-column, 2-page brochure. 
            The output MUST be a valid JSON object matching this SPECIFIC structure:
            {
              "eventTitle": "Full Title with Subtitle",
              "department": "Organizing Department Name",
              "dates": "Inclusive Dates (e.g. 23rd-27th March 2026)",
              "googleForm": "Actual registration URL or placeholder",
              "committee": [
                { "name": "Name", "role": "Specific Role (e.g. Chief Patron, Patron, Convener, Advisory Committee Member)" }
              ],
              "registration": {
                "ieeePrice": "Number",
                "nonIeeePrice": "Number",
                "deadline": "Date",
                "notes": [
                    "Detailed instruction 1 (e.g. Registration confirmation date)",
                    "Detailed instruction 2 (e.g. Session timings 9:30 AM - 4:00 PM)",
                    "Detailed instruction 3 (e.g. Participation certificate will be provided)",
                    "Detailed instruction 4 (e.g. Bring your own Laptops)"
                ]
              },
              "accountDetails": {
                "bankName": "Bank Name",
                "accountNo": "AccountNumber",
                "accountName": "Official Account Name",
                "accountType": "SB/Current",
                "branch": "Specific Branch",
                "ifscCode": "IFSC8888"
              },
              "aboutCollege": "200-300 words detailed history of the university",
              "aboutSchool": "150-200 words about the specific computing school",
              "aboutDepartment": "150-200 words about the organizing department focus",
              "aboutFdp": "150-200 words about this specific Faculty Development Program objective",
              "topics": [
                { "date": "Date", "forenoon": "Forenoon Topic", "afternoon": "Afternoon Topic" }
              ],
              "speakers": [
                { "name": "Dr. Name", "org": "Institution/Organization", "role": "Designation" }
              ],
              "contact": { "name": "Prof. Name", "mobile": "9999999999" }
            }
            REQUIREMENTS:
            1. FILL ALL PLACES: Do not leave empty arrays or strings.
            2. PROFESSIONAL TONE: Use formal, academic language.
            3. ROLE DIVERSITY: Include Chief Patrons, Patrons, Advisory Committee, and Organizing Committee.
            4. DENSITY: For 'About' sections, write full paragraphs as specified.
            5. CONSISTENCY: Ensure all dates match the event title.`
          },
          ...formattedHistory,
          { role: 'user', content: prompt }
        ],
        reasoning: { enabled: true },
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const message = response.data.choices[0].message;
    let content = message.content;
    
    // Attempt to extract JSON if wrapped in markdown code blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        content = jsonMatch[0];
    }
    
    const parsedData = JSON.parse(content);
    
    logger.log('OPENROUTER', 'GENERATE_BROCHURE', { prompt, historyCount: history.length }, { data: parsedData, raw: message });
    
    return {
        data: parsedData,
        rawMessage: message
    };
  } catch (error: any) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(`Rate limit hit. Retrying in 2 seconds... (${retries} retries left)`);
      await sleep(2000);
      return generateBrochureData(prompt, history, retries - 1);
    }
    
    logger.log('OPENROUTER', 'ERROR', { prompt }, { error: error.message, details: error.response?.data }, 'ERROR');
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}
