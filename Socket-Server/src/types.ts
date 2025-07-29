export type Role = "system" | "assistant" | "user";

export interface Message {
  role: Role;
  content: string;
}


export interface Messagedata extends Document {
    question: string
    answer: string
    rating?: string
    guideline?: string
}