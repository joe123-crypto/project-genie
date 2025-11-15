import { NextApiRequest, NextApiResponse } from 'next';
import { generateText } from 'ai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const result = await generateText({
      model: 'google/gemini-pro',
      prompt: prompt,
    });
    
    const text = result.text;

    res.status(200).json({ text });

  } catch (error) {
    console.error('Error in Gemini API call:', error);
    res.status(500).json({ error: 'Failed to generate text from Gemini' });
  }
}
