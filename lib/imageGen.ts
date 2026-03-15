import axios from 'axios';

const FAL_API_KEY = process.env.NEXT_PUBLIC_FAL_API_KEY;

export async function generateEventImage(prompt: string) {
  try {
    const response = await axios.post(
      'https://fal.run/fal-ai/flux/schnell',
      {
        prompt: `Professional academic conference poster illustration, ${prompt}, technology theme, vector style, blue and white color palette, high resolution, minimalist`,
        image_size: 'landscape_4_3',
        num_inference_steps: 4,
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
