export default async function handler(request, response) {

  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return response.status(500).json({ error: 'API key is not configured' });
  }

  const userPrompt = request.body.prompt;
  if (!userPrompt) {
    return response.status(400).json({ error: 'Prompt is required' });
  }
  
  const modelName = 'gemini-2.5-flash-preview-05-20';
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;

  try {
    const geminiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
        "generationConfig": {
          "responseMimeType": "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error('Gemini API Error:', errorBody);
      throw new Error(errorBody.error.message || 'Failed to fetch from Gemini API');
    }

    const geminiData = await geminiResponse.json();
    
	  const textResponse = geminiData.candidates[0].content.parts[0].text;

    response.setHeader('Content-Type', 'application/json');
    return response.status(200).send(textResponse);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ conversation: `Вибачте, сталася помилка: ${error.message}` });
  }
}