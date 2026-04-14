import { GoogleGenAI } from "@google/genai";

export async function analyzeWorkoutScreenshot(imageFile: File) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key não configurada. Verifique as variáveis de ambiente.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analise este print de tela do Samsung Health.
    Extraia os dados de treino: atividade, duração e calorias.
    Retorne um JSON no formato:
    {
      "activity": string,
      "duration": string,
      "calories": number
    }
    Se houver mais de um treino, retorne um array de objetos.
    Se não conseguir ler, retorne null.
  `;

  // Converter o arquivo para base64
  const reader = new FileReader();
  const base64Image = await new Promise<string>((resolve) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(imageFile);
  });

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      prompt,
      {
        inlineData: {
          data: base64Image.split(',')[1],
          mimeType: imageFile.type,
        },
      },
    ]
  });

  const text = result.text;
  
  try {
    // Tenta limpar a resposta para extrair apenas o JSON
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Erro ao processar resposta do Gemini:", e);
    return null;
  }
}
