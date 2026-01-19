import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateActivityReport = async (
  keywords: string,
  unitName: string,
  date: string,
  attendanceCount: number
): Promise<string> => {
  const client = getAiClient();
  if (!client) return "Ralat: Kunci API tidak ditemui. Sila pastikan API Key ditetapkan.";

  const prompt = `
    Anda adalah seorang setiausaha kokurikulum yang profesional. Sila tulis satu laporan ringkas tetapi formal dalam Bahasa Melayu untuk aktiviti kokurikulum berikut:
    
    Unit: ${unitName}
    Tarikh: ${date}
    Kehadiran: ${attendanceCount} orang murid
    Aktiviti/Kata Kunci: ${keywords}
    
    Format laporan mestilah mengandungi:
    1. Tajuk Aktiviti
    2. Objektif Ringkas (reka satu yang sesuai berdasarkan aktiviti)
    3. Perjalanan Aktiviti (berdasarkan kata kunci)
    4. Penutup
    
    Sila berikan output teks sahaja tanpa markdown formatting yang rumit.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    return response.text || "Tiada laporan berjaya dijana.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ralat semasa menjana laporan. Sila cuba lagi.";
  }
};
