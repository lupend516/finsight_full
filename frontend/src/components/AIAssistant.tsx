import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  MessageSquare, 
  X, 
  Send, 
  Brain,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI financial assistant. I can help you understand your finances, answer questions about your data, and provide strategic recommendations. How can I help you today?',
      timestamp: new Date(),
      suggestions: [
        'What\'s my cash flow forecast?',
        'Show me expense trends',
        'Any unusual transactions?',
        'How to improve profit margins?'
      ]
    }
  ]);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages([...messages, userMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getAIResponse(input),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);

    setInput('');
  };

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('cash flow') || lowerQuery.includes('forecast')) {
      return 'Based on your current trends, your cash flow forecast for the next 6 months looks positive. You\'re expected to maintain an average monthly cash position of $130,000, with peak cash in December at $185,000. Your main cash inflows come from client payments (85%) and your largest outflow is payroll (45% of expenses).';
    }
    
    if (lowerQuery.includes('expense') || lowerQuery.includes('spending')) {
      return 'Your expenses have increased by 5.2% this month, primarily driven by increased marketing spend (+18%) and office expenses (+12%). However, this is within normal range for your business growth trajectory. I recommend reviewing your software subscriptions - you have 3 tools with overlapping features that could save you $480/month if consolidated.';
    }
    
    if (lowerQuery.includes('unusual') || lowerQuery.includes('fraud') || lowerQuery.includes('suspicious')) {
      return 'I\'ve flagged 3 transactions for your review: a large international wire transfer ($25,000), multiple small round-amount transactions, and a payment to an unfamiliar vendor. These patterns are unusual for your business. Would you like me to provide more details on any of these?';
    }
    
    if (lowerQuery.includes('profit') || lowerQuery.includes('margin')) {
      return 'Your net profit margin is currently 33.5%, which is excellent and above industry average. To improve further, I recommend: 1) Focus on your consulting services which have 45% higher margins, 2) Negotiate better terms with your top 3 suppliers, 3) Optimize your pricing strategy for your premium tier customers who show higher retention.';
    }
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
      return 'Your revenue is up 12.5% this month! The growth is driven by strong performance in your consulting services (+28%) and an increase in average deal size from $15,000 to $18,500. Your revenue forecast for the next quarter is $225,000 with 87% confidence.';
    }
    
    return 'I understand your question. Let me analyze your financial data... Based on your current business metrics, everything looks healthy. Your revenue is growing steadily, expenses are under control, and cash flow is positive. Is there a specific aspect of your finances you\'d like me to dive deeper into?';
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 z-50"
        size="icon"
      >
        <MessageSquare size={24} />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Brain size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                AI Financial Assistant
                <Sparkles size={14} />
              </h3>
              <p className="text-xs text-blue-100">Ask me anything about your finances</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                {message.type === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Brain size={12} className="text-white" />
                    </div>
                    <span className="text-xs font-medium text-slate-600">AI Assistant</span>
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                {message.suggestions && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-slate-500 mb-2">Suggested questions:</p>
                    {message.suggestions.map((suggestion, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-left text-xs h-auto py-2"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Lightbulb size={12} className="mr-2 flex-shrink-0" />
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                )}
                <span className="text-xs text-slate-500 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100 whitespace-nowrap">
            <TrendingUp size={12} className="mr-1" />
            Revenue trends
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100 whitespace-nowrap">
            <AlertCircle size={12} className="mr-1" />
            Risk alerts
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-slate-100 whitespace-nowrap">
            <Lightbulb size={12} className="mr-1" />
            Recommendations
          </Badge>
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your finances..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} size="icon" className="bg-blue-600 hover:bg-blue-700">
            <Send size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
}
