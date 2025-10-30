import { GoogleGenAI, Type, Chat } from "@google/genai";
import { FormField, Tone, Personality, OutputLength, AspectRatio, ArtStyle, DocumentType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. The app may not function correctly.");
}

export const generateText = async (
  prompt: string,
  tone: Tone,
  personality: Personality,
  outputLength: OutputLength,
  keywords: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  let lengthInstruction = '';
  switch (outputLength) {
    case OutputLength.Short:
      lengthInstruction = 'The output should be a short paragraph, around 3-4 sentences.';
      break;
    case OutputLength.Medium:
      lengthInstruction = 'The output should be of medium length, around 2-3 paragraphs.';
      break;
    case OutputLength.Long:
      lengthInstruction = 'The output should be a long and detailed response, several paragraphs long.';
      break;
  }

  let keywordsInstruction = '';
  if (keywords.trim()) {
    keywordsInstruction = `Please incorporate the following keywords: ${keywords.trim()}.`;
  }

  const systemInstruction = `You are a helpful AI assistant with the personality of a ${personality}. Your tone should be ${tone}. Please respond in Thai. ${lengthInstruction} ${keywordsInstruction}`.trim();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
      }
    });
    
    const text = response.text;
    if (!text) {
      throw new Error("Received an empty response from the API.");
    }
    return text;
  } catch (error) {
    console.error("Error generating text:", error);
    if (error instanceof Error) {
      throw new Error(`เกิดข้อผิดพลาดในการสร้างข้อความ: ${error.message}`);
    }
    throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างข้อความ");
  }
};


export const analyzeAndFillForm = async (
  imagePart: { inlineData: { data: string; mimeType: string } },
  infoText: string
): Promise<FormField[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const systemInstruction = `You are an intelligent document processing assistant.
Your task is to analyze an image of a form and fill it out using the provided text.
Identify each field label on the form and find the corresponding value from the text.
For each field, you must also provide the pixel coordinates of the bounding box where the value should be written. The coordinates (x, y, width, height) should be relative to the top-left corner of the input image.
Output the result as a JSON object containing a single key "form_data", which is an array of objects. Each object in the array should have three properties: "field" (the label from the form), "value" (the extracted information), and "coordinates" (an object with x, y, width, and height in pixels).
Ensure the JSON is well-formed. The response should be in Thai.`;

  const textPart = {
    text: `Please fill the form in the image using this information:\n\n---\n${infoText}\n---`,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            form_data: {
              type: Type.ARRAY,
              description: "An array of filled form fields with their coordinates.",
              items: {
                type: Type.OBJECT,
                properties: {
                  field: {
                    type: Type.STRING,
                    description: "The label of the form field."
                  },
                  value: {
                    type: Type.STRING,
                    description: "The value filled into the field."
                  },
                  coordinates: {
                    type: Type.OBJECT,
                    description: "The bounding box for the value on the original image.",
                    properties: {
                      x: { type: Type.NUMBER, description: "The x-coordinate of the top-left corner." },
                      y: { type: Type.NUMBER, description: "The y-coordinate of the top-left corner." },
                      width: { type: Type.NUMBER, description: "The width of the bounding box." },
                      height: { type: Type.NUMBER, description: "The height of the bounding box." }
                    },
                    required: ["x", "y", "width", "height"]
                  }
                },
                required: ["field", "value", "coordinates"]
              }
            }
          },
          required: ["form_data"]
        },
        temperature: 0.1,
      }
    });

    const jsonString = response.text;
    if (!jsonString) {
      throw new Error("Received an empty response from the API.");
    }
    
    const parsed = JSON.parse(jsonString);
    if (parsed.form_data && Array.isArray(parsed.form_data)) {
        return parsed.form_data;
    } else {
        console.warn("API response for form analysis is not in the expected format:", parsed);
        throw new Error("ไม่สามารถวิเคราะห์เอกสารได้ในขณะนี้ รูปแบบการตอบกลับไม่ถูกต้อง");
    }

  } catch (error) {
    console.error("Error analyzing form:", error);
     if (error instanceof SyntaxError) {
        throw new Error("เกิดข้อผิดพลาดในการแปลผลข้อมูลจาก AI ผลลัพธ์อาจไม่ใช่ JSON ที่ถูกต้อง");
    }
    if (error instanceof Error) {
      throw new Error(`เกิดข้อผิดพลาดในการวิเคราะห์เอกสาร: ${error.message}`);
    }
    throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการวิเคราะห์เอกสาร");
  }
};

export const generateDocument = async (
    prompt: string,
    docType: DocumentType
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    const systemInstruction = `You are a professional document creator. Your task is to generate a complete document based on the user's request.
The requested document type is "${docType}".
Use the provided information to craft a well-structured and comprehensive document.
Use markdown for formatting like headings, bold text, bullet points, etc.
The entire response must be in Thai and ready for direct use.
For a Resume, include standard sections like Contact Info, Summary, Experience, Education, and Skills.
For a Cover Letter, adopt a professional letter format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.5,
                topP: 0.95,
            }
        });

        const text = response.text;
        if (!text) {
            throw new Error("Received an empty response from the API.");
        }
        return text;
    } catch (error) {
        console.error("Error generating document:", error);
        if (error instanceof Error) {
            throw new Error(`เกิดข้อผิดพลาดในการสร้างเอกสาร: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างเอกสาร");
    }
};


const stylePromptMap: Partial<Record<ArtStyle, string>> = {
    [ArtStyle.Photorealistic]: 'photorealistic',
    [ArtStyle.Anime]: 'anime style',
    [ArtStyle.Cyberpunk]: 'cyberpunk style',
    [ArtStyle.Steampunk]: 'steampunk style',
    [ArtStyle.Fantasy]: 'fantasy art',
    [ArtStyle.Watercolor]: 'watercolor painting',
    [ArtStyle.PixelArt]: 'pixel art',
    [ArtStyle.Abstract]: 'abstract art',
    [ArtStyle.Cartoon]: 'cartoon style',
};

const BASE_IMAGE_PROMPT = "A high-quality, futuristic aesthetic with glossy, freshly reflective aluminum alloy surfaces. Features sharp, vibrant laser and rainbow lights with meticulous, exquisite reflections of light and shadow.";

export const generateImages = async (
    prompt: string,
    numberOfImages: number,
    aspectRatio: AspectRatio,
    artStyle: ArtStyle,
): Promise<string[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    
    let finalPrompt = prompt;
    const styleAddition = stylePromptMap[artStyle];
    if (styleAddition) {
        finalPrompt = `${prompt}, ${styleAddition}`;
    }

    finalPrompt = `${finalPrompt}, ${BASE_IMAGE_PROMPT}`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
                numberOfImages: numberOfImages,
                outputMimeType: 'image/jpeg',
                aspectRatio: aspectRatio,
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Received no images from the API.");
        }

        return response.generatedImages.map(img => `data:image/jpeg;base64,${img.image.imageBytes}`);

    } catch (error) {
        console.error("Error generating images:", error);
        if (error instanceof Error) {
            throw new Error(`เกิดข้อผิดพลาดในการสร้างภาพ: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างภาพ");
    }
};

export const generatePromptSuggestions = async (basePrompt: string): Promise<string[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    
    const systemInstruction = `You are an expert prompt engineer for an advanced AI image generator. Your task is to take a user's basic idea and expand it into 4 diverse, detailed, and creative prompts.
- Each prompt should be a single, continuous string.
- The prompts should explore different artistic styles, compositions, lighting, and moods.
- Keep the prompts concise but descriptive.
- Respond in Thai.
- Your output must be a JSON object with a single key "suggestions", which is an array of 4 strings.`;

    const textPart = {
        text: `Generate prompts based on this idea: "${basePrompt}"`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [textPart] },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            description: "An array of 4 creative image generation prompts.",
                            items: {
                                type: Type.STRING,
                                description: "A single prompt suggestion."
                            }
                        }
                    },
                    required: ["suggestions"]
                },
                temperature: 0.8,
            }
        });

        const jsonString = response.text;
        if (!jsonString) {
            throw new Error("Received an empty response from the API.");
        }
        
        const parsed = JSON.parse(jsonString);
        if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
            return parsed.suggestions;
        } else {
            console.warn("API response for prompt suggestions is not in the expected format:", parsed);
            throw new Error("ไม่สามารถสร้างคำแนะนำได้ในขณะนี้ รูปแบบการตอบกลับไม่ถูกต้อง");
        }

    } catch (error) {
        console.error("Error generating prompt suggestions:", error);
        if (error instanceof SyntaxError) {
            throw new Error("เกิดข้อผิดพลาดในการแปลผลข้อมูลจาก AI สำหรับคำแนะนำ");
        }
        if (error instanceof Error) {
            throw new Error(`เกิดข้อผิดพลาดในการสร้างคำแนะนำ: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างคำแนะนำ");
    }
};

export const generateImageCaption = async (imageDataUrl: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }

    try {
        const [meta, base64Data] = imageDataUrl.split(',');
        if (!meta || !base64Data) {
            throw new Error("Invalid data URL format.");
        }
        
        const mimeTypeMatch = meta.match(/:(.*?);/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType,
            },
        };
        
        const textPart = {
            text: "อธิบายภาพนี้อย่างละเอียดและสร้างสรรค์ในภาษาไทย"
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const text = response.text;
        if (!text) {
          throw new Error("Received an empty response from the API.");
        }
        return text;

    } catch (error) {
        console.error("Error generating image caption:", error);
        if (error instanceof Error) {
            throw new Error(`เกิดข้อผิดพลาดในการสร้างคำอธิบายภาพ: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างคำอธิบายภาพ");
    }
};

export const generateVideoPromptSuggestion = async (basePrompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const systemInstruction = `You are a creative assistant for an advanced AI video generator. Your task is to take a user's basic idea and expand it into a single, vivid, and detailed prompt suitable for generating a video. 
  - The prompt should be a single continuous string of text.
  - Focus on visual details, actions, camera movements, and atmosphere.
  - Do not use markdown or formatting.
  - Respond ONLY with the suggested prompt text in Thai.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User's idea: "${basePrompt}"`,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8,
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Received an empty response from the API.");
    }
    return text.trim();
  } catch (error) {
    console.error("Error generating video prompt suggestion:", error);
    if (error instanceof Error) {
      throw new Error(`เกิดข้อผิดพลาดในการสร้างคำแนะนำ: ${error.message}`);
    }
    throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างคำแนะนำ");
  }
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: string,
    onProgress: (message: string) => void,
    image?: { base64: string; mimeType: string; }
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    try {
        const aiForVideo = new GoogleGenAI({ apiKey: process.env.API_KEY });
        onProgress("กำลังเริ่มกระบวนการสร้างวิดีโอ...");

        const finalPrompt = `${prompt}, ${BASE_IMAGE_PROMPT}`;

        const payload: {
            model: string;
            prompt: string;
            image?: { imageBytes: string; mimeType: string; };
            config: {
                numberOfVideos: number;
                aspectRatio: string;
            };
        } = {
            model: 'veo-3.1-fast-generate-preview',
            prompt: finalPrompt,
            config: {
                numberOfVideos: 1,
                aspectRatio: aspectRatio,
            }
        };

        if (image) {
            payload.image = {
                imageBytes: image.base64,
                mimeType: image.mimeType,
            };
        }

        let operation = await aiForVideo.models.generateVideos(payload);

        const progressMessages = [
            "กำลังอุ่นเครื่องฟิล์มดิจิทัล...",
            "กำลังเรนเดอร์พิกเซลให้เคลื่อนไหว...",
            "กำลังจัดเรียงเฟรมต่างๆ...",
            "ใกล้จะเสร็จแล้ว กำลังประมวลผลขั้นสุดท้าย...",
            "กำลังสร้างผลงานชิ้นเอก..."
        ];
        let messageIndex = 0;

        while (!operation.done) {
            onProgress(progressMessages[messageIndex % progressMessages.length]);
            messageIndex++;
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            operation = await aiForVideo.operations.getVideosOperation({ operation: operation });
        }
        
        onProgress("วิดีโอพร้อมแล้ว!");

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!downloadLink) {
            throw new Error("ไม่พบลิงก์ดาวน์โหลดวิดีโอในผลลัพธ์");
        }
        
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`เกิดข้อผิดพลาดในการดาวน์โหลดวิดีโอ: ${response.statusText} - ${errorBody}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);

    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof Error) {
            throw new Error(`เกิดข้อผิดพลาดในการสร้างวิดีโอ: ${error.message}`);
        }
        throw new Error("เกิดข้อผิดพลาดที่ไม่รู้จักในการสร้างวิดีโอ");
    }
};


class ChatService {
  private chat: Chat | null = null;

  startChat(): void {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    this.chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'You are a friendly and helpful AI assistant named "ผู้ช่วย AI อัจฉริยะ". Please respond in Thai.',
      }
    });
  }

  async sendMessageStream(message: string) {
    if (!this.chat) {
      this.startChat();
    }
    if (!this.chat) {
      throw new Error("Chat session could not be initialized.");
    }
    return this.chat.sendMessageStream({ message });
  }
}

export const chatService = new ChatService();