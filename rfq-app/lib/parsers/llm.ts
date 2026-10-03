import Groq from "groq-sdk";
import type { ParsedQuoteRow } from "./excel";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function parseQuoteWithLLM(text: string): Promise<ParsedQuoteRow[]> {
  try {
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert at extracting quote information from unstructured text. 
Extract all quoted items as a JSON array of objects with the following keys:
- lineNumber (number, best guess if not explicitly stated)
- description (string)
- partNumber (string, if applicable)
- quantity (number)
- unit (string, e.g. "PCS")
- unitPrice (number, price per unit)
- leadTimeDays (number, optional)
- remarks (string, optional)

ONLY return valid JSON. Do not return markdown blocks or any other text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      model: "llama3-70b-8192", // Fast and reliable for data extraction
      temperature: 0.1,
    });

    const output = response.choices[0]?.message?.content || "[]";
    // Strip markdown formatting if the model still returns it
    const cleanOutput = output.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(cleanOutput);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Groq Extraction Error:", error);
    return [];
  }
}
