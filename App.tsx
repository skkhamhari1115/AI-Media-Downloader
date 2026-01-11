
import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, Search, History, ShieldCheck, Zap, Video, Music, 
  AlertCircle, Loader2, Trash2, ExternalLink, MessageSquare, 
  Sparkles, Send, X, Tag, CheckCircle2, Globe, Clock, BarChart2
} from 'lucide-react';
import { geminiService } from './services/geminiService';
import { MediaMetadata, DownloadHistoryItem, MediaQuality, ChatMessage } from './types';
import { Chat, GenerateContentResponse } from '@google/genai';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [groundingSources, setGroundingSources] = useState<any[]>([]);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // AI Chat States
  const [showAiChat, setShowAiChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Download Simulation State
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('');

  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedHistory = localStorage.getItem('aimedia_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showAiChat, isTyping]);

  const saveToHistory = (title: string, quality: MediaQuality) => {
    const newItem: DownloadHistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      timestamp: Date.now(),
      quality
    };
    const updatedHistory = [newItem, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('aimedia_history', JSON.stringify(updatedHistory));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setMetadata(null);
    setShowAiChat(false);
    setChatMessages([]);

    try {
      const { metadata: data, sources } = await geminiService.analyzeUrl(url);
      setMetadata(data);
      setGroundingSources(sources);
      chatSessionRef.current = geminiService.createChatSession(data);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Check your URL and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatSessionRef.current || isTyping) return;

    const userMsg = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const stream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      let fullText = '';
      
      // Initialize an empty model response
      setChatMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        const chunkText = (chunk as GenerateContentResponse).text || '';
        fullText += chunkText;
        setChatMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullText;
          return newMessages;
        });
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'model', text: 'Connection lost. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startDownload = (option: any) => {
    if (downloadingId) return;
    
    setDownloadingId(option.quality);
    setDownloadProgress(0);
    setDownloadStatus('Requesting streams...');

    const duration = 4000; // 4 seconds total simulation
    const steps = [
      { p: 20, s: 'Verifying mirrors...' },
      { p: 50, s: 'Fetching high-bitrate segments...' },
      { p: 85, s: 'Transmuxing 4K streams...' },
      { p: 100, s: 'Completing download...' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setDownloadProgress(step.p);
        setDownloadStatus(step.s);
        if (step.p === 100) {
          setTimeout(() => {
            saveToHistory(metadata?.title || 'Media', option.quality as MediaQuality);
            setDownloadingId(null);
            alert(`Download successful: ${metadata?.title} [${option.label}]`);
          }, 500);
        }
      }, (duration / steps.length) * (idx + 1));
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/40">
              <Download className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight flex flex-col leading-none">
              AI MEDIA <span className="text-blue-500 text-[10px] tracking-widest">DOWNLOADER</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="p-3 hover:bg-white/5 rounded-full transition-all group relative"
            >
              <History className="w-5 h-5 text-slate-400 group-hover:text-blue-400" />
              {history.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-slate-950"></span>
              )}
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-bold text-green-400">
              <ShieldCheck className="w-3 h-3" /> SECURE ENGINE
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-24 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-8 animate-bounce shadow-xl shadow-blue-500/5">
            <Sparkles className="w-3.5 h-3.5" />
            POWERED BY GEMINI 3 PRO
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
            The World's Smartest <br />
            <span className="gradient-text">Media Hub.</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Extract anything from YouTube, Instagram, or TikTok. 
            AI-verified quality, up to 4K resolution.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <form onSubmit={handleAnalyze} className="relative flex items-center bg-slate-900 border border-white/10 rounded-2xl p-2 shadow-2xl transition-all">
              <div className="flex-grow flex items-center pl-4">
                <Search className="w-5 h-5 text-slate-500 mr-3" />
                <input
                  type="text"
                  placeholder="Paste URL (YouTube, TikTok, Instagram...)"
                  className="w-full bg-transparent border-none py-4 focus:outline-none text-lg placeholder:text-slate-600"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isAnalyzing || !url}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    Verify & Fetch
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Results Area */}
        <div className="space-y-10">
          {error && (
            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="glass rounded-[2rem] p-16 text-center flex flex-col items-center gap-6 border-white/5 shadow-inner">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Initializing AI Grounding...</h3>
                <p className="text-slate-500 font-medium">Gemini 3 Pro is searching for secure 4K delivery nodes.</p>
              </div>
            </div>
          )}

          {metadata && !isAnalyzing && (
            <div className="grid gap-8 animate-in fade-in zoom-in-95 duration-500">
              {/* Media Card */}
              <div className="glass rounded-[2rem] overflow-hidden border-white/10 shadow-2xl">
                <div className="grid md:grid-cols-5 h-full">
                  <div className="md:col-span-2 relative">
                    <img 
                      src={metadata.thumbnail || `https://picsum.photos/seed/${metadata.title}/800/800`} 
                      alt={metadata.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <div className="px-3 py-1 bg-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                        {metadata.platform} VERIFIED
                      </div>
                    </div>
                  </div>
                  
                  <div className="md:col-span-3 p-8 flex flex-col">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <h3 className="text-2xl font-black leading-tight line-clamp-2">{metadata.title}</h3>
                      <button 
                        onClick={() => setShowAiChat(!showAiChat)}
                        className={`p-3 rounded-full transition-all ${showAiChat ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-slate-400'}`}
                        title="AI Media Assistant"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 mb-6 pb-6 border-b border-white/5">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {metadata.duration}</span>
                      <span className="flex items-center gap-1.5 text-blue-400"><BarChart2 className="w-3.5 h-3.5" /> HIGH BITRATE</span>
                      <span className="flex items-center gap-1.5 text-slate-300">BY {metadata.author.toUpperCase()}</span>
                    </div>

                    {/* AI Logic Display */}
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-5 mb-8 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-20">
                        <Sparkles className="w-12 h-12 text-blue-500" />
                      </div>
                      <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Grounded Insights
                      </h5>
                      <p className="text-sm text-slate-300 leading-relaxed italic pr-8">"{metadata.summary}"</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {metadata.tags.map(tag => (
                          <span key={tag} className="text-[10px] bg-slate-900 border border-white/10 text-slate-400 px-2 py-1 rounded-md uppercase tracking-tighter">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Download Controls */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verified Direct Streams</p>
                      {metadata.options.map((option, idx) => (
                        <div key={idx} className="relative group">
                          {downloadingId === option.quality ? (
                            <div className="w-full bg-slate-900 border border-blue-500/30 rounded-xl p-4 overflow-hidden relative">
                              <div 
                                className="absolute inset-0 bg-blue-600/10 transition-all duration-300" 
                                style={{ width: `${downloadProgress}%` }}
                              ></div>
                              <div className="flex justify-between items-center relative z-10">
                                <div className="flex items-center gap-3">
                                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                  <span className="text-xs font-bold text-blue-400">{downloadStatus}</span>
                                </div>
                                <span className="text-xs font-black">{downloadProgress}%</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => startDownload(option)}
                              className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all group/btn"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${option.quality === MediaQuality.AUDIO ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {option.quality === MediaQuality.AUDIO ? <Music className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                                </div>
                                <div className="text-left">
                                  <div className="font-bold text-slate-100 flex items-center gap-2">
                                    {option.label}
                                    {option.quality === MediaQuality.UHD_4K && (
                                      <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded-full font-black">ULTRA</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-bold">{option.format.toUpperCase()} • {option.size}</div>
                                </div>
                              </div>
                              <Download className="w-5 h-5 text-slate-500 group-hover/btn:text-blue-500 transition-all transform group-hover/btn:translate-y-0.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Sources from Grounding */}
              {groundingSources.length > 0 && (
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Globe className="w-3 h-3" /> Verification Sources
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {groundingSources.slice(0, 3).map((source, i) => (
                      <a 
                        key={i} 
                        href={source.web?.uri || '#'} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold truncate max-w-[200px]"
                      >
                        <ExternalLink className="w-2.5 h-2.5" /> {source.web?.title || 'External Source'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Panel */}
              {showAiChat && (
                <div className="glass rounded-[2rem] overflow-hidden border-blue-500/20 shadow-2xl flex flex-col h-[500px] animate-in slide-in-from-right-4 duration-300">
                  <div className="p-5 bg-blue-600/10 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm uppercase tracking-tight">AI Media Assistant</h4>
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-bold text-blue-400">ANALYZING CONTEXT...</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowAiChat(false)} className="p-2 hover:bg-white/5 rounded-full">
                      <X className="w-5 h-5 text-slate-500" />
                    </button>
                  </div>
                  
                  <div className="flex-grow overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center px-12 opacity-50">
                        <Sparkles className="w-12 h-12 mb-4 text-blue-500" />
                        <h5 className="font-bold text-slate-200 mb-2">I'm familiar with this media.</h5>
                        <p className="text-xs">Ask me about the key points, the creator's style, or technical details.</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 text-slate-300 border border-white/10 rounded-tl-none shadow-sm'
                        }`}>
                          {msg.text || (msg.role === 'model' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />)}
                        </div>
                      </div>
                    ))}
                    {isTyping && chatMessages[chatMessages.length-1].role === 'user' && (
                      <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-2xl rounded-tl-none">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/50 border-t border-white/10 flex gap-3">
                    <input
                      type="text"
                      placeholder="Ask the AI about this video..."
                      className="flex-grow bg-slate-950 border border-white/10 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                    />
                    <button 
                      type="submit"
                      disabled={!userInput.trim() || isTyping}
                      className="p-3 bg-blue-600 hover:bg-blue-500 rounded-xl disabled:opacity-50 transition-all active:scale-90 shadow-lg shadow-blue-500/20"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Features Grid */}
          {!metadata && !isAnalyzing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12">
              {[
                { icon: Sparkles, title: "Deep Analysis", text: "AI verification of metadata, bitrate, and content context.", color: "text-blue-500", bg: "bg-blue-500/10" },
                { icon: Globe, title: "Global Retrieval", text: "High-speed delivery nodes for 4K and Ultra-HD streams.", color: "text-green-500", bg: "bg-green-500/10" },
                { icon: ShieldCheck, title: "Smart Verification", text: "Grounded by Google Search to ensure content safety.", color: "text-purple-500", bg: "bg-purple-500/10" }
              ].map((f, i) => (
                <div key={i} className="glass p-8 rounded-[2rem] border-white/5 group hover:border-blue-500/20 transition-all hover:-translate-y-2 duration-300">
                  <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center ${f.color} mb-6 group-hover:scale-110 transition-transform`}>
                    <f.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-black text-lg mb-3 uppercase tracking-tighter">{f.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* History Sidebar */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={() => setShowHistory(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 h-full shadow-2xl border-l border-white/10 p-8 flex flex-col animate-in slide-in-from-right-full duration-500">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black flex items-center gap-3 tracking-tighter">
                <History className="w-6 h-6 text-blue-500" />
                ACTIVITY LOG
              </h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4 flex-grow overflow-y-auto pr-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="text-center py-20 text-slate-600">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-8 h-8 opacity-20" />
                  </div>
                  <p className="font-bold text-sm uppercase tracking-widest">No Recent Downloads</p>
                </div>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/20 transition-all group">
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <p className="font-bold text-slate-200 line-clamp-1 flex-grow uppercase tracking-tight text-sm">{item.title}</p>
                      <span className="text-[10px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md">
                        {item.quality}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-black">
                      <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-green-500" /> COMPLETED</span>
                      <span className="uppercase opacity-50">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <button 
                onClick={() => { setHistory([]); localStorage.removeItem('aimedia_history'); }}
                className="mt-8 w-full py-4 text-slate-500 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 font-black text-xs tracking-widest uppercase"
              >
                Flush Logs
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950/80 mt-20">
        <div className="max-w-6xl mx-auto px-4 py-16 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2 grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              <Download className="w-5 h-5 text-blue-500" />
              <span className="font-black tracking-tighter uppercase">AI Media Downloader</span>
            </div>
            <p className="text-slate-600 text-xs font-bold tracking-tight text-center md:text-left max-w-xs leading-relaxed">
              Grounded AI Media Acquisition Engine. Please respect creator intellectual property. Built for educational exploration.
            </p>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-500 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Nodes</a>
            <a href="#" className="hover:text-blue-500 transition-colors">API Status</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
