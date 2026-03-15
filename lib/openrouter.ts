import axios from 'axios';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export async function generateBrochureData(prompt: string, history: any[] = []) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat', // High quality for structured JSON
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates structured JSON for university brochures.
            Required fields:
            - eventTitle
            - department
            - dates
            - registration: { ieeePrice, nonIeeePrice, deadline }
            - googleForm
            - committee: array of { role, name }
            - aboutCollege, aboutSchool, aboutDepartment
            - topics: array of { date, forenoon, afternoon }
            - speakers: array of { name, org, role } (optional)
            
            ALWAYS return ONLY valid JSON. If fields are missing, ask the user in a natural way first, OR if you have enough info, generate placeholders and mark them for editing.`
          },
          ...history,
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}
