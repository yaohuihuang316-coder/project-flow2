
declare module 'html2canvas';
declare module 'jspdf';

// Mock declaration for the runtime-imported Gemini SDK
declare module '@google/genai' {
    export class GoogleGenAI {
        constructor(config: { apiKey: string });
        models: {
            generateContent(params: any): Promise<any>;
            generateContentStream(params: any): Promise<any>;
        };
    }
}
