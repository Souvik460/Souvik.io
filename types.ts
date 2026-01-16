
export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface Library {
  id: string;
  name: string;
  url: string;
  type: 'css' | 'js';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
