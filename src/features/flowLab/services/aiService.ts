export class AIService {
  static async getSuggestions(prompt: string): Promise<any[]> {
    return [
      {
        id: "s-1",
        verse: "على ميزان دقيق نضبط النبرات",
        fitScore: 9.2,
        rhymeScheme: "الروي الموحد",
        syllableCount: 14,
        emotionalTone: ["حماسة", "نفوذ"],
      }
    ];
  }
}
