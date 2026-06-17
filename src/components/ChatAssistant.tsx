import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, X, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useMemoryStore } from "../store/memoryStore";
import { GoogleGenAI } from "@google/genai";

const GEMINI_POOL: string[] = [
  (import.meta as any).env.VITE_GEMINI_KEY_01 || "",
  (import.meta as any).env.VITE_GEMINI_KEY_02 || "",
  (import.meta as any).env.VITE_GEMINI_KEY_03 || "",
].filter(Boolean);

const GEMINI_KEY_FALLBACK = (import.meta as any).env.VITE_GEMINI_API_KEY || "";

if (GEMINI_POOL.length === 0 && GEMINI_KEY_FALLBACK) {
  GEMINI_POOL.push(GEMINI_KEY_FALLBACK);
}

let activeKeyIndex = 0;

async function generateChatContent(systemInstruction: string, userMsg: string): Promise<any> {
  if (GEMINI_POOL.length === 0) {
    throw new Error("No Gemini keys configured in the rotation pool.");
  }

  const maxAttempts = GEMINI_POOL.length;
  let lastError: any = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const currentIndex = activeKeyIndex % GEMINI_POOL.length;
    const currentKey = GEMINI_POOL[currentIndex];

    try {
      const client = new GoogleGenAI({ apiKey: currentKey });
      const result = await (client as any).models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `${systemInstruction}\n\nالمستخدم: ${userMsg}`,
        config: { temperature: 0.6 },
      });
      return result;
    } catch (error: any) {
      console.warn(`Chat assistant pool key at index ${currentIndex} failed. Error:`, error.message || error);
      lastError = error;
      activeKeyIndex++;
    }
  }

  throw lastError;
}

interface Message {
  role: "user" | "model";
  text: string;
}

export const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const getRecentContext = useMemoryStore((state) => state.getRecentContext);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const context = getRecentContext(10);

      const systemInstruction = `
أنت المساعد الذكي لتطبيق Metric Matrix OS2.
سياق العمل الحالي (آخر التحليلات والعمليات):
${context}

مهمتك هي مساعدة الرابر في تحليل البارات، تحسين القوافي، فهم الدلالات الصوتية، أو تقديم نصائح هندسية.
كن مبدعاً، تقنياً، وداعماً. استخدم المصطلحات التي تم تعريفها في التطبيق (المسامير الصوتية، الموراي، الترانزيت اللفظي).
      `;

      const result = await generateChatContent(systemInstruction, userMsg);

      const responseText = result.text || "عذراً، لم أستطع توليد رد.";

      setMessages((prev) => [...prev, { role: "model", text: responseText }]);

      // Save to memory
      useMemoryStore.getState().addEntry({
        type: "chat",
        content: { user: userMsg, model: responseText },
        summary: `محادثة حول: ${userMsg.substring(0, 30)}...`,
      });
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gold-400 text-bg-base rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group"
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-quality-high rounded-full animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-6 w-[400px] h-[600px] bg-bg-surface border border-border-default rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-border-default flex items-center justify-between bg-gold-400/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-400/10 flex items-center justify-center border border-gold-400/20">
                  <Sparkles className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    مساعد OS2 الذكي
                  </h3>
                  <p className="text-[10px] text-quality-high font-bold uppercase tracking-widest">
                    Online & Ready
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-bg-base rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                  <Bot className="w-12 h-12 text-gold-400" />
                  <p className="text-sm text-text-muted max-w-[200px]">
                    أهلاً بك! أنا ذاكرة OS2 المركزية. كيف يمكنني مساعدتك في
                    مشروعك اليوم؟
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "user" ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gold-400 text-bg-base rounded-tr-none"
                        : "bg-bg-base border border-border-default text-text-primary rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-bg-base border border-border-default p-3 rounded-2xl rounded-tl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border-default bg-bg-base/50">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="اسأل عن القوافي، التحليل، أو الهندسة..."
                  className="w-full bg-bg-surface border border-border-default rounded-xl pl-12 pr-4 py-3 text-sm text-text-primary focus:border-gold-400/50 outline-none transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-gold-400 text-bg-base rounded-lg hover:bg-gold-300 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
