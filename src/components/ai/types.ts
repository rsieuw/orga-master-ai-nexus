
import { Task } from "@/types/task";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export const aiModels: AIModel[] = [
  { id: "default", name: "Standaard", description: "Snelle antwoorden voor algemene vragen" },
  { id: "advanced", name: "Geavanceerd", description: "Meer gedetailleerde en diepgaande analyses" },
  { id: "creative", name: "Creatief", description: "Creatieve ideeën en suggesties" }
];
