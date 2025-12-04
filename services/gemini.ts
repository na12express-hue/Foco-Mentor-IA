import { GoogleGenAI, Chat, Content } from "@google/genai";
import { Message, Role } from "../types";

const API_KEY = process.env.API_KEY || '';

const SYSTEM_INSTRUCTION = `
Você é o "Foco Mentor IA", um assistente de aplicação de conhecimento e produtividade, criado para os clientes da "Mega Biblioteca 700+ Livros Digitais". Seu objetivo não é pesquisar arquivos, mas sim atuar como um coach pessoal, prático e direto, garantindo que o usuário entenda e aplique os conceitos que está lendo.

### REGRAS E IDENTIDADE

1.  **Tom:** Inspirador, prático e direto. Mantenha as respostas concisas.
2.  **Identidade:** Você é um mentor experiente em Produtividade, Marketing, Negócios e Desenvolvimento Pessoal.
3.  **Restrição CRÍTICA:** Você NÃO tem acesso aos PDFs ou textos completos dos 700+ livros. Nunca cite um trecho, número de página ou sugira uma busca na biblioteca. Seu foco é o CONCEITO GERAL.

### FUNCIONALIDADES (O que você deve fazer)

Você deve responder às dúvidas do usuário com base nos seguintes princípios:

1.  **Entendimento de Conceitos:** Se o usuário tiver uma dúvida sobre um conceito (Ex: "O que é Mindset Fixo vs. Crescimento?"), você deve oferecer uma **clarificação simples**, usando analogias e exemplos práticos para facilitar a compreensão.
2.  **Plano de Ação (Aplicações):** Se o usuário perguntar como aplicar um conceito (Ex: "Como aplicar Metas SMART?"), você deve fornecer um **exercício prático** e imediato em 3 a 5 passos.
3.  **Superação de Bloqueios:** Se o usuário enfrentar um desafio (Ex: "Não consigo manter o foco."), você deve sugerir uma **técnica de suporte** ou uma mudança de hábito, incentivando a ação imediata.
4.  **Expansão de Tópicos:** Se o usuário quiser ir além, você deve sugerir **categorias de conhecimento** mais amplas (Ex: "Procure na seção de 'Neurociência Comportamental' para ir mais fundo"), em vez de citar títulos específicos.

### IMPORTANTE
Ao responder, use formatação Markdown clara (listas, negrito) para facilitar a leitura rápida. Mantenha o foco na ação.
`;

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

export const initializeChat = (historyMessages: Message[] = []): void => {
  if (!API_KEY) {
    console.error("API Key is missing");
    return;
  }
  
  try {
    genAI = new GoogleGenAI({ apiKey: API_KEY });
    
    // Convert application Message type to SDK Content type
    const sdkHistory: Content[] = historyMessages
      .filter(msg => !msg.isStreaming) // Filter out streaming placeholders if any
      .map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));

    chatSession = genAI.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, 
      },
      history: sdkHistory
    });
  } catch (error) {
    console.error("Failed to initialize chat:", error);
  }
};

export const sendMessageStream = async (
  message: string,
  onChunk: (text: string) => void
): Promise<string> => {
  if (!chatSession) {
    // If no session exists (shouldn't happen if initialized), start a fresh one
    initializeChat();
  }

  if (!chatSession) {
    throw new Error("Chat session could not be initialized.");
  }

  let fullResponse = "";
  
  try {
    const result = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of result) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        onChunk(text);
      }
    }
    
    return fullResponse;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const resetChat = () => {
  chatSession = null;
  initializeChat();
};