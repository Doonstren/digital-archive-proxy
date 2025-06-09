export default async function handler(request, response) {
  // Разрешаем запросы с любого источника (для GitHub Pages)
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Vercel автоматически обрабатывает preflight-запросы
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
  
  const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

  try {
    const geminiResponse = await fetch(geminiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userPrompt }] }],
      }),
    });

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.json();
      console.error('Gemini API Error:', errorBody);
      throw new Error(errorBody.error.message || 'Failed to fetch from Gemini API');
    }

    const geminiData = await geminiResponse.json();
    
    // Извлекаем чистый текстовый ответ из сложной структуры Gemini
    const textResponse = geminiData.candidates[0].content.parts[0].text;

    // Отправляем чистый текст обратно на сайт
    return response.status(200).send(textResponse);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: error.message });
  }
}