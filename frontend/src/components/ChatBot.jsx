import { useState, useRef, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const FAQ = [
  { patterns: ['what is ecopulse','what does ecopulse do','about ecopulse','tell me about'],
    answer: "EcoPulse is your personal carbon footprint tracker 🌍 It lets you log daily transport, diet & energy use, then gives you AI-powered insights powered by Gemini 2.5 Flash — plus real-time air quality data for your city." },
  { patterns: ['how to use','how do i','get started','how does it work','steps'],
    answer: "Here's how to get started:\n1️⃣ **Sign Up** — create a free account (email or Google)\n2️⃣ **Set Profile** — enter your city, commute mode & diet\n3️⃣ **Log Activity** — takes 30 seconds daily\n4️⃣ **Get Insights** — Gemini AI + live AQI gives you one personalised tip every day 🤖" },
  { patterns: ['co2','carbon','footprint','emission','calculate'],
    answer: "CO₂e measures your climate impact. EcoPulse calculates it from:\n🚗 **Transport** — distance × emission factor\n🥗 **Diet** — vegan (2kg/day) to meat-heavy (7kg/day)\n⚡ **Energy** — 0.4 kg CO₂e per kWh\nBased on DEFRA/EPA guidelines." },
  { patterns: ['aqi','air quality','pollution'],
    answer: "AQI is fetched live from OpenWeather 🌬️\n1 - Good 🟢  2 - Fair 🟡  3 - Moderate 🟠  4 - Poor 🔴  5 - Very Poor ⚫\nIf AQI is 4–5, EcoPulse will recommend adjusting your commute." },
  { patterns: ['streak','plant','grow','guardian'],
    answer: "Your virtual plant grows with your streak 🌱\n🌱 Seed → 🌿 Sprout → 🪴 Growing → 🌳 Tree → 🌍 Earth Guardian\nLog every day to keep it alive!" },
  { patterns: ['free','cost','price','pay'],
    answer: "EcoPulse is completely free 🎉 No credit card, no subscription." },
  { patterns: ['firebase','data','secure','privacy','safe'],
    answer: "Data is stored in Google Firestore with row-level security 🔒 Only you can read or write your entries. We use Firebase Auth and never sell your data." },
  { patterns: ['gemini','ai','recommendation','insight','tip'],
    answer: "Insights come from Gemini 2.5 Flash 🤖 It reads your CO₂e footprint, current AQI, and commute mode — then generates one specific, actionable tip. No generic advice." },
  { patterns: ['log','entry','track','record'],
    answer: "Go to **Log Activity** from the dashboard. You can log:\n🚗 Transport mode + distance\n🥗 Diet type\n⚡ Electricity (kWh, optional)\nYou'll see a live CO₂e estimate before saving." },
  { patterns: ['trend','chart','graph','history','delete','revert'],
    answer: "The Trends page shows a colour-coded bar chart 📊 You can also **delete any entry** using the 🗑️ button — with a 5-second Undo option if you change your mind." },
];

function matchFAQ(text) {
  const lower = text.toLowerCase();
  for (const item of FAQ) {
    if (item.patterns.some(p => lower.includes(p))) return item.answer;
  }
  return null;
}

const SUGGESTIONS = ['How do I get started?','What is CO₂e?','How does AQI work?','Can I delete an entry?'];

function renderText(text) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function ChatBot() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState([{
    role: 'bot',
    text: "Hi! I'm EcoPulse AI 🌿 Ask me anything about the app — how it works, carbon tracking, air quality, or anything else!",
  }]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setTyping(true);

    const faqAnswer = matchFAQ(userText);
    if (faqAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'bot', text: faqAnswer }]);
        setTyping(false);
      }, 500);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "I'm not sure about that! Try asking about carbon tracking, AQI, streaks, or how to use EcoPulse 🌿",
      }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close EcoPulse chatbot' : 'Open EcoPulse chatbot'}
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #a8d5a2 0%, #7ec8c8 50%, #b8a9e0 100%)' }}>
        {open ? '✕' : '🌿'}
      </button>

      {open && (
        <div role="dialog" aria-label="EcoPulse AI chatbot" aria-modal="true"
          className="chat-slide-up fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: '480px', background: '#faf9f6', border: '1px solid #e2e8f0' }}>

          <div className="px-4 py-3 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #a8d5a2 0%, #7ec8c8 60%, #b8a9e0 100%)' }}>
            <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center text-xl" aria-hidden="true">🌿</div>
            <div>
              <p className="font-bold text-white text-sm">EcoPulse AI</p>
              <p className="text-white/80 text-xs">Ask me anything</p>
            </div>
            <div className="ml-auto flex items-center gap-1" aria-hidden="true">
              <span className="w-2 h-2 rounded-full bg-green-200 animate-pulse" />
              <span className="text-white/70 text-xs">Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                    style={{ background: 'linear-gradient(135deg, #a8d5a2, #7ec8c8)' }} aria-hidden="true">
                    🌿
                  </div>
                )}
                <div className="max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { background:'linear-gradient(135deg,#7ec8c8,#a8d5a2)', color:'#fff', borderBottomRightRadius:'4px' }
                    : { background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderBottomLeftRadius:'4px' }}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start" aria-label="Bot is typing" role="status">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2"
                  style={{ background: 'linear-gradient(135deg, #a8d5a2, #7ec8c8)' }} aria-hidden="true">🌿</div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                  <span className="dot-1 w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  <span className="dot-2 w-2 h-2 rounded-full bg-gray-400 inline-block" />
                  <span className="dot-3 w-2 h-2 rounded-full bg-gray-400 inline-block" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full border transition hover:opacity-80"
                  style={{ background:'#f0fdf4', borderColor:'#a8d5a2', color:'#2d6a4f' }}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 pb-3">
            <div className="flex gap-2 items-center bg-white rounded-xl border border-gray-200 px-3 py-2">
              <label htmlFor="chat-input" className="sr-only">Chat message</label>
              <input id="chat-input" ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Ask me anything…"
                className="flex-1 outline-none text-sm bg-transparent text-gray-700 placeholder-gray-400" />
              <button onClick={() => sendMessage()} disabled={!input.trim() || typing}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #a8d5a2, #7ec8c8)' }}
                aria-label="Send message">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
