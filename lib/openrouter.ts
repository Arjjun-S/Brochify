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
        model: 'openai/gpt-oss-120b:free',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that generates structured JSON for university brochures. 
            ALWAYS return ONLY valid JSON. If fields are missing, ask for them.`
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
