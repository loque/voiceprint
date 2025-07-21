export interface ScriptSuggestion {
  code: string;
  displayName: string;
  iconId: string;
  scripts: string[];
}

const scriptSuggestions = {
  en_US: {
    code: "en_US",
    displayName: "English (US)",
    iconId: "us",
    scripts: [
      "Hey Assistant, turn on the living room lights and set the temperature to 72 degrees. Also, can you play some relaxing music in the bedroom?",
      "Good morning! Please start the coffee maker, open the garage door, and tell me today's weather forecast and my calendar appointments.",
      "I'm heading to bed now. Turn off all the lights downstairs, lock the front door, and set the alarm for 7 AM tomorrow morning.",
      "Can you dim the kitchen lights to 50 percent, start the dishwasher, and remind me to take out the trash in one hour?",
      "What's the status of all my smart devices? Also, please turn on the porch light and check if any windows are open.",
    ],
  },
  es_AR: {
    code: "es_AR",
    displayName: "Español (Argentina)",
    iconId: "ar",
    scripts: [
      "Hola Asistente, encendé las luces del living y poné la temperatura en 22 grados. También, ¿podés poner música relajante en la habitación?",
      "¡Buen día! Por favor, prendé la cafetera, abrí la puerta del garage y decime el pronóstico del tiempo y mis citas de hoy.",
      "Me voy a dormir. Apagá todas las luces de abajo, cerrá la puerta de entrada con llave y poné la alarma para las 7 de la mañana.",
      "¿Podés bajar las luces de la cocina al 50 por ciento, poner en marcha el lavavajillas y recordarme sacar la basura en una hora?",
      "¿Cuál es el estado de todos mis dispositivos inteligentes? También, encendé la luz del porche y fijate si hay alguna ventana abierta.",
    ],
  },
} satisfies Record<string, ScriptSuggestion>;

export type LanguageCode = keyof typeof scriptSuggestions;

export const availableLanguages: ScriptSuggestion[] =
  Object.values(scriptSuggestions);

export function getScriptSuggestions(
  language: LanguageCode = "en_US"
): string[] {
  return scriptSuggestions[language]?.scripts || [];
}
