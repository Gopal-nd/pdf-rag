'use client'
import { useEffect, useState, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
const apiKey = "AIzaSyDs8u85IWUgyvfY4pikks8-m-yK3grPtCg"; // Replace with your actual key

const ai = new GoogleGenAI({ apiKey });

type Message = {
  role: "user" | "model";
  content: string;
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const chatRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("chat_history");
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage whenever messages update
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(messages));
  }, [messages]);

  const initChat = async () => {
    if (!chatRef.current) {
      chatRef.current = await ai.chats.create({
        model: "gemini-2.0-flash",
        history: messages.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        })),
      });
    }
    return chatRef.current;
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    const chat = await initChat();
    const stream = await chat.sendMessageStream({ message: input });

    let modelReply = "";
    for await (const chunk of stream) {
      modelReply += chunk.text;
      setMessages((prev) => {
        const newMsgs = [...prev];
        if (newMsgs[newMsgs.length - 1].role === "model") {
          newMsgs[newMsgs.length - 1].content = modelReply;
        } else {
          newMsgs.push({ role: "model", content: modelReply });
        }
        return [...newMsgs];
      });
    }
  };

  return (
    <div className="min-h-screenp-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Gemini Chat</h1>
      <div className="flex-1 overflow-y-auto rounded shadow p-4 mb-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded ${
              msg.role === "user"
                ? "text-right"
                : " text-left"
            }`}
          >
             <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 rounded border"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}


