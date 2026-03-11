import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateImageDescription = async (file: File): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    const mimeType = file.type;

    const prompt = `
      Atue como um Engenheiro Civil perito elaborando um laudo técnico.
      Analise esta imagem e forneça APENAS uma legenda técnica curta e objetiva (máximo 15 palavras).
      
      Foque em:
      - Patologias (fissuras, infiltrações, corrosão, etc.)
      - Elemento estrutural (viga, pilar, laje, alvenaria)
      - Material (concreto, cerâmica, madeira, metálica)
      - Localização (se evidente: fachada, interno, externo)

      Exemplos de saída desejada:
      "Fissura diagonal em alvenaria de vedação interna."
      "Infiltração ativa na laje de teto da garagem."
      "Armadura exposta com corrosão em pilar de concreto."
      "Vista geral da fachada principal sem anomalias visíveis."

      NÃO use numeração na resposta. Apenas o texto da legenda.
      Responda em Português do Brasil.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text?.trim() || "Descrição não disponível.";

  } catch (error) {
    console.error("Erro na análise da imagem:", error);
    throw new Error("Falha ao analisar imagem com IA.");
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};