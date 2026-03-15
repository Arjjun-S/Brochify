import axios from 'axios';

const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

export async function generateBrochureData(prompt: string, history: any[] = []) {
  try {
    // Mapping our history to OpenRouter format and preserving reasoning_details if they exist
    const formattedHistory = history.map(m => ({
        role: m.role,
        content: m.content,
        // If the message has reasoning_details, we include it as per user requirement
        ...(m.reasoning_details ? { reasoning_details: m.reasoning_details } : {})
    }));

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-oss-120b:free', // New model requested by user
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
            - speakers: array of { name, org, role }
            
            ALWAYS return ONLY valid JSON. If fields are missing, ask for them.
            IMPORTANT: Return the response as a JSON object.`
          },
          ...formattedHistory,
          { role: 'user', content: prompt }
        ],
        reasoning: { enabled: true }, // Reasoning enabled as requested
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
    
    // We parse the content as JSON but we also want to return the raw message 
    // to preserve reasoning_details for the chat history.
    return {
        data: JSON.parse(message.content),
        rawMessage: message // contains reasoning_details
    };
  } catch (error) {
    console.error('Error calling OpenRouter:', error);
    throw error;
  }
}
