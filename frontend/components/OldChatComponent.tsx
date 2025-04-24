'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCircle, Bot } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import ReactMarkdown from 'react-markdown'
import { useMutation, useQuery } from '@tanstack/react-query'

const OldChatComponent = ({ id, chatId }: { id: string, chatId: string }) => {
  const [messages, setMessages] = useState<{ type: string, text: string }[]>([]);
  const [input, setInput] = useState('');
  const [res, setRes] = useState<any>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: ChatHistory, isLoading } = useQuery({
    queryKey: ["chat-history", chatId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/api/chat/history/${chatId}`);
      return res.data.data;
    },
    enabled: !!chatId,
  });

  useEffect(() => {
    if (ChatHistory && messages.length === 0) {
      const formatted = ChatHistory.map((msg: any) => ({
        type: msg.role === 'user' ? 'user' : 'bot',
        text: msg.content,
      }));
      setMessages(formatted);
    }
  }, [ChatHistory]);

  const mutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await axiosInstance.get(`/api/chat/${chatId}`, {
        params: { id, query }
      });
      return response.data.data;
    },
    onMutate: async (inputMsg: string) => {
      setMessages(prev => [
        ...prev,
        { type: 'user', text: inputMsg },
        { type: 'bot', text: 'Agent is typing...' }
      ]);
    },
    onSuccess: (data) => {
      setRes(data);
      setMessages(prev => [
        ...prev.slice(0, -1),
        { type: 'bot', text: data.res }
      ]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    const userInput = input;
    setInput('');
    mutation.mutate(userInput);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!input.trim()) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, res]);

  if (isLoading) {
    return <p className="p-4 text-center">Loading...</p>;
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto border rounded-md overflow-hidden">
      <div className="p-4 border-b text-lg font-semibold">
        Chat Interface
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full px-4 py-2">
          <div className="flex flex-col space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 ${
                  msg.type === 'user' ? 'justify-start' : 'justify-end'
                }`}
              >
                {msg.type === 'user' && (
                  <div className="flex-shrink-0 mt-1">
                    <UserCircle size={24} className="text-blue-500" />
                  </div>
                )}

                <div
                  className={`px-3 py-2 rounded-lg max-w-xs sm:max-w-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-700 text-secondary-foreground font-semibold'
                      : 'bg-primary-foreground text-secondary-foreground'
                  }`}
                >
                  <span><ReactMarkdown>{msg?.text}</ReactMarkdown></span>
                </div>

                {msg.type === 'bot' && (
                  <div className="flex-shrink-0 mt-1">
                    <Bot size={24} className="text-gray-500" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 resize-none"
            rows={2}
          />
          <Button onClick={handleSend} className="self-end">Send</Button>
        </div>
      </div>
    </div>
  );
};

export default OldChatComponent;
