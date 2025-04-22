'use client'

import React, { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserCircle, Bot } from 'lucide-react';
import axiosInstance from '@/lib/axios';
import ReactMarkdown from 'react-markdown'
const dummyMessages = [
    { type: 'bot', text: 'Hello! How can I help you today?' },
];

const ChatComponent = () => {
  const [messages, setMessages] = useState(dummyMessages);
  const [input, setInput] = useState('');
  const [res, setRes] = useState<any>();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = async() => {
    if (!input.trim()) return;
    
    const response =await axiosInstance.get(`/api/chat/new?query=${input}`);
    setMessages((prevMessages) => [...prevMessages, { type: 'user', text: input }]);
     console.log(response.data.data)
     const data = response.data.data
    setMessages((prevMessages) => [...prevMessages, { type: 'bot', text: response.data.data.res }]);

     setRes(data)
    
    setInput('');
  };

  const handleKeyDown = async(e: React.KeyboardEvent) => {
    if(!input.trim()) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages,res]);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto border rounded-md overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b text-lg font-semibold ">
        Chat Interface
      </div>

      {/* Scrollable chat area */}
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
                    ?' bg-blue-700 text-secondary-foreground font-semibold' 
                    : ' bg-primary-foreground text-secondary-foreground' 

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

      {/* Input area */}
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

export default ChatComponent;