'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Bot, ChevronRight, FileText, Mail, MessageSquare, Phone, Send, Sparkles, X } from 'lucide-react';
import { business } from '@/lib/content';

type Message = {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  actionCard?: 'lead-form';
};

const SUGGESTED_QUESTIONS = [
  'How fast can I get a cash offer?',
  'Do I need to make repairs first?',
  'How flexible is the closing date?',
  'Are there any fees or commissions?',
  'What areas in Florida do you serve?',
];

function getKnowledgeResponse(query: string): { text: string; showLeadForm?: boolean } {
  const q = query.toLowerCase();

  if (q.includes('offer') || q.includes('cash') || q.includes('how fast') || q.includes('sell my') || q.includes('quote') || q.includes('worth')) {
    return {
      text: 'We deliver a fair, transparent written cash offer within 24 hours of receiving your address and property details. There are zero obligations and no high-pressure negotiations. Would you like to share your address so Darren Richardson can prepare your offer?',
      showLeadForm: true,
    };
  }

  if (q.includes('repair') || q.includes('condition') || q.includes('as-is') || q.includes('fix') || q.includes('damage') || q.includes('roof')) {
    return {
      text: 'You do NOT need to make any repairs or upgrades! Elite Homes USA purchases homes strictly as-is in any condition—whether it needs minor cosmetic touch-ups, a new roof, or major structural repairs. Skip the contractors and cleaning; we take care of everything.',
      showLeadForm: true,
    };
  }

  if (q.includes('fee') || q.includes('commission') || q.includes('cost') || q.includes('hidden') || q.includes('charge')) {
    return {
      text: 'Our process is 100% transparent with ZERO hidden fees! Unlike listing through a traditional real estate agent, you pay no 6% agent commissions, and we cover standard closing costs. The amount in our cash offer is the exact amount you walk away with.',
    };
  }

  if (q.includes('close') || q.includes('timeline') || q.includes('schedule') || q.includes('fast') || q.includes('days')) {
    return {
      text: 'We work entirely on your schedule! If you need to sell quickly, we can close in as little as 7 days. If you need 30 to 60 days to plan your move, pack, or find your next home, we adjust the closing date to fit your comfort.',
    };
  }

  if (q.includes('area') || q.includes('where') || q.includes('location') || q.includes('jacksonville') || q.includes('florida')) {
    return {
      text: 'We specialize in Jacksonville and surrounding Northeast Florida, including Duval County, St. Johns County, Clay County, Orange Park, San Marco, Southside, Riverside, Avondale, and the Jacksonville Beaches.',
    };
  }

  if (q.includes('darren') || q.includes('contact') || q.includes('call') || q.includes('phone') || q.includes('speak') || q.includes('number')) {
    return {
      text: `You can reach Darren Richardson directly at ${business.phone} (Mon – Sat: 8:00 AM – 7:00 PM EST) or email us at ${business.email}. We are always happy to talk through your situation with zero pressure.`,
    };
  }

  return {
    text: 'At Elite Homes USA, our mission is to provide homeowners with a reliable, fast, and stress-free alternative to traditional real estate transactions. Would you like to request a 24-hour cash offer for your Jacksonville property, or ask about our as-is process?',
    showLeadForm: true,
  };
}

export function LiveAssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'options' | 'chat'>('options');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Hello! I am the automated real estate assistant for Darren Richardson at Elite Homes USA. How can I help you with your property today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [leadValues, setLeadValues] = useState({ name: '', address: '', phone: '' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadBusy, setLeadBusy] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && view === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, view, isTyping]);

  function handleSend(userText: string) {
    const text = userText.trim();
    if (!text) return;

    setView('chat');

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getKnowledgeResponse(text);
      const assistantMsg: Message = {
        id: 'asst-' + Date.now(),
        sender: 'assistant',
        text: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionCard: response.showLeadForm ? 'lead-form' : undefined,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 600);
  }

  async function handleLeadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!leadValues.name || !leadValues.address || !leadValues.phone) return;

    setLeadBusy(true);
    try {
      const res = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadValues.name,
          address: leadValues.address,
          phone: leadValues.phone,
          condition: 'As-Is',
          source: 'Live Assistant Concierge',
        }),
      });

      if (res.ok) {
        setLeadSubmitted(true);
        setMessages(prev => [
          ...prev,
          {
            id: 'lead-success-' + Date.now(),
            sender: 'assistant',
            text: `Thank you, ${leadValues.name}! We received your request for ${leadValues.address}. Darren Richardson and our team are reviewing the neighborhood sales and will reach out to ${leadValues.phone} with your 24-hour written cash offer.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setLeadSubmitted(true);
      setMessages(prev => [
        ...prev,
        {
          id: 'lead-fallback-' + Date.now(),
          sender: 'assistant',
          text: `Thank you, ${leadValues.name}! Your request has been recorded for Darren Richardson. You can also reach him immediately at ${business.phone}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLeadBusy(false);
    }
  }

  return (
    <div className="live-assistant-root">
      {/* Floating Trigger Button: Clean "Get in Touch" pill */}
      {!isOpen && (
        <button
          type="button"
          className="live-chat-floating-btn"
          onClick={() => {
            setIsOpen(true);
          }}
          aria-label="Open contact and concierge options"
        >
          <div className="live-chat-btn-icon-wrap" aria-hidden="true">
            <MessageSquare size={17} />
            <span className="live-chat-pulse-dot" />
          </div>
          <span className="live-chat-btn-label">Get in Touch</span>
        </button>
      )}

      {/* Concierge Window */}
      {isOpen && (
        <div className="live-chat-window" role="dialog" aria-label="Get in touch options">
          {/* Header */}
          <div className="live-chat-header">
            <div className="live-chat-header-info">
              <div className="live-chat-avatar" aria-hidden="true">
                <span>EH</span>
                <span className="live-chat-avatar-status" />
              </div>
              <div className="live-chat-title-group">
                <h4>Elite Homes USA</h4>
                <span className="live-chat-status-text">
                  <span className="live-status-indicator" />
                  Available · Jacksonville Office
                </span>
              </div>
            </div>
            <div className="live-chat-header-actions">
              <a
                href={'tel:+1' + business.phone.replace(/\D/g, '').slice(-10)}
                className="live-chat-header-action-btn"
                title={`Call: ${business.phone}`}
                aria-label="Call Darren Richardson directly"
              >
                <Phone size={15} aria-hidden="true" />
              </a>
              <button
                type="button"
                className="live-chat-header-action-btn close"
                onClick={() => setIsOpen(false)}
                aria-label="Close dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* VIEW 1: Contact Options Hub */}
          {view === 'options' && (
            <div className="live-concierge-options-body">
              <div className="live-concierge-intro">
                <h5>How can we help you today?</h5>
                <p>Choose an option below to connect with Darren Richardson and the Elite Homes USA team.</p>
              </div>

              <div className="live-options-list">
                {/* Option 1: AI Concierge */}
                <button
                  type="button"
                  className="live-option-card highlight"
                  onClick={() => setView('chat')}
                >
                  <div className="live-option-icon ai">
                    <Sparkles size={20} />
                  </div>
                  <div className="live-option-text">
                    <div className="live-option-badge-row">
                      <strong>AI Real Estate Assistant</strong>
                      <span className="live-badge-instant">Instant</span>
                    </div>
                    <p>Instant answers on cash offers, closing timelines, and as-is home sales.</p>
                  </div>
                  <ChevronRight size={18} className="live-option-arrow" />
                </button>

                {/* Option 2: Direct Phone */}
                <a
                  href={'tel:+1' + business.phone.replace(/\D/g, '').slice(-10)}
                  className="live-option-card"
                >
                  <div className="live-option-icon phone">
                    <Phone size={20} />
                  </div>
                  <div className="live-option-text">
                    <strong>Call {business.phone}</strong>
                    <p>Direct line to Darren Richardson · Mon – Sat: 8:00 AM – 7:00 PM EST</p>
                  </div>
                  <ChevronRight size={18} className="live-option-arrow" />
                </a>

                {/* Option 3: Request Cash Offer */}
                <Link
                  href="/get-offer"
                  className="live-option-card"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="live-option-icon offer">
                    <FileText size={20} />
                  </div>
                  <div className="live-option-text">
                    <strong>Request 24-Hr Cash Offer</strong>
                    <p>Enter your address for a no-obligation, as-is written cash offer.</p>
                  </div>
                  <ChevronRight size={18} className="live-option-arrow" />
                </Link>

                {/* Option 4: Send a Message */}
                <Link
                  href="/contact"
                  className="live-option-card"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="live-option-icon email">
                    <Mail size={20} />
                  </div>
                  <div className="live-option-text">
                    <strong>Send a Message</strong>
                    <p>Send an inquiry to team@elitehomes1.com · 24hr response.</p>
                  </div>
                  <ChevronRight size={18} className="live-option-arrow" />
                </Link>
              </div>

              <div className="live-options-footer">
                <span>📍 Jacksonville & Northeast Florida · Licensed Cash Buyer</span>
              </div>
            </div>
          )}

          {/* VIEW 2: Interactive AI Assistant Chat */}
          {view === 'chat' && (
            <div className="live-chat-conversation-wrap">
              <div className="live-chat-nav-bar">
                <button
                  type="button"
                  className="live-back-btn"
                  onClick={() => setView('options')}
                >
                  <ArrowLeft size={14} />
                  <span>All Contact Options</span>
                </button>
              </div>

              <div className="live-chat-messages-scroll">
                {messages.map(msg => (
                  <div key={msg.id} className={`live-chat-row ${msg.sender}`}>
                    {msg.sender === 'assistant' && (
                      <div className="live-chat-avatar-icon" aria-hidden="true">
                        <Bot size={13} />
                      </div>
                    )}
                    <div className="live-chat-bubble">
                      <p>{msg.text}</p>

                      {/* Inline Lead Form */}
                      {msg.actionCard === 'lead-form' && !leadSubmitted && (
                        <div className="live-chat-lead-card">
                          <div className="live-chat-lead-head">
                            <Sparkles size={14} />
                            <strong>Request 24-Hr Cash Offer</strong>
                          </div>
                          <form onSubmit={handleLeadSubmit} className="live-chat-lead-form">
                            <input
                              type="text"
                              required
                              placeholder="Your full name"
                              value={leadValues.name}
                              onChange={e => setLeadValues(v => ({ ...v, name: e.target.value }))}
                            />
                            <input
                              type="text"
                              required
                              placeholder="Property address in Jacksonville area"
                              value={leadValues.address}
                              onChange={e => setLeadValues(v => ({ ...v, address: e.target.value }))}
                            />
                            <input
                              type="tel"
                              required
                              placeholder="Phone number"
                              value={leadValues.phone}
                              onChange={e => setLeadValues(v => ({ ...v, phone: e.target.value }))}
                            />
                            <button type="submit" className="live-chat-lead-btn" disabled={leadBusy}>
                              <span>{leadBusy ? 'Submitting…' : 'Submit for Cash Offer'}</span>
                              <ArrowRight size={14} />
                            </button>
                          </form>
                        </div>
                      )}

                      <span className="live-chat-time">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="live-chat-row assistant">
                    <div className="live-chat-avatar-icon" aria-hidden="true">
                      <Bot size={13} />
                    </div>
                    <div className="live-chat-bubble typing">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Pills */}
              <div className="live-chat-pills-bar" aria-label="Suggested questions">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button
                    type="button"
                    key={q}
                    className="live-chat-pill-btn"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input Footer */}
              <form
                className="live-chat-bottom-form"
                onSubmit={e => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
              >
                <input
                  type="text"
                  placeholder="Ask a question or enter your address..."
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  aria-label="Chat message"
                />
                <button
                  type="submit"
                  className="live-chat-send-btn"
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
