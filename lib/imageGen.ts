import axios from 'axios';

const FAL_API_KEY = process.env.NEXT_PUBLIC_FAL_API_KEY;

export async function generateEventImage(prompt: string) {
  try {
    const response = await axios.post(
      'https://fal.run/fal-ai/nano-banana-pro', // New model name
      {
        prompt: `Professional academic conference poster illustration, ${prompt}, technology theme, vector style, blue and white color palette, high resolution, minimalist`,
        aspect_ratio: '16:9',
        resolution: '1K',
        num_images: 1,
        output_format: 'png'
      },
      {
        headers: {
          Authorization: `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.images[0].url;
  } catch (error) {
    console.error('Error calling FAL AI:', error);
    return null;
  }
}
