
declare module 'html2canvas';
declare module 'jspdf';

// Mock declaration for the runtime-imported Gemini SDK
// This matches the imports from https://esm.sh/@google/genai
declare module '@google/genai' {
    export class GoogleGenAI {
        constructor(config: { apiKey: string });
        models: {
            generateContent(params: any): Promise<any>;
            generateContentStream(params: any): Promise<AsyncIterable<any>>;
        };
    }
}
