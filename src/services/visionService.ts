import { GoogleGenAI } from "@google/genai";

export async function analyzeWorkoutScreenshot(imageFile: File) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("API Key do Gemini não encontrada no visionService. Configure a variável GEMINI_API_KEY.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analise este print de tela de um app de fitness (como Samsung Health).
    Extraia os dados de treino: atividade, duração e calorias.
    Se for uma imagem contendo métricas detalhadas (como ritmo médio, distância, zonas cardíacas), inclua o campo 'details'.

    Retorne APENAS um objeto JSON no formato abaixo. NÃO inclua crases, comentários ou texto fora do JSON.
    Exemplo de formato:
    {
      "activity": "Corrida",
      "duration": "46:20",
      "calories": 362,
      "details": {
        "distanceKm": 4.50,
        "averagePace": "10'17\\"/km",
        "averageHeartRateBpm": 131,
        "averageCadencePpm": 112,
        "elevationGainMeters": 34,
        "splits": [
          { "distance": "1.00 km", "time": "11:42", "pace": "11'42\\"" }
        ],
        "heartRateZones": [
          { "zone": 5, "name": "Máxima", "range": "161-178 bpm", "usage": "Mínimo" }
        ],
        "advancedMetrics": {
          "asymmetry": "Tendência para o lado Direito (Azul)",
          "groundContactTime": "Alto/Lento (Laranja)",
          "flightTime": "Ótimo (Verde)",
          "regularity": "Tendência para o lado Direito (Azul)",
          "vertical": "Médio (Laranja)",
          "stiffness": "Médio (Laranja)"
        },
        "performanceAndRecovery": {
          "vo2Max": 36.1,
          "vo2MaxClassification": "Ruim",
          "estimatedSweatLossMl": 606,
          "hydrationRecommendationMl": 909,
          "device": "Galaxy Watch7"
        }
      }
    }
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
