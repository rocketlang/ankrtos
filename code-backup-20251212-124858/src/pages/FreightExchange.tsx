/**
 * ANKR Freight Exchange - With Voice Input 🎤
 */
import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Truck, Package, MapPin, IndianRupee, 
  Plus, Search, Gavel, Zap, Users, RefreshCw, Loader2,
  BarChart3, ArrowUpRight, ArrowDownRight, MessageCircle, X, Send, Mic, MicOff, Volume2
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const getSurgeColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'LOW': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'NORMAL': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'SURGE': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': case 'published': return 'bg-blue-500/20 text-blue-400';
    case 'bidding': return 'bg-green-500/20 text-green-400';
    case 'available': return 'bg-green-500/20 text-green-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
};

const TREND_DATA = [
  { lane: 'Chennai → Delhi', vehicle: '32FT MXL', days: [82500, 84000, 85500, 83000, 86000, 85000, 84500], today: 84500, weekAvg: 84357, change: 2.4 },
  { lane: 'Mumbai → Bangalore', vehicle: '32FT MXL', days: [65000, 64500, 66000, 67000, 65500, 66500, 67000], today: 67000, weekAvg: 65929, change: 3.1 },
  { lane: 'Delhi → Kolkata', vehicle: '22FT', days: [72000, 71500, 73000, 72500, 74000, 73500, 72000], today: 72000, weekAvg: 72643, change: -0.9 },
  { lane: 'Ahmedabad → Pune', vehicle: '32FT SXL', days: [45000, 44500, 46000, 45500, 44000, 45000, 44500], today: 44500, weekAvg: 44929, change: -1.0 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE HOOK - Web Speech API
// ═══════════════════════════════════════════════════════════════════════════════
const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN'; // Hindi (also understands English)
      
      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return { isListening, transcript, isSupported, toggleListening, startListening, stopListening };
};

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT-TO-SPEECH HOOK
// ═══════════════════════════════════════════════════════════════════════════════
const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN'; // Hindi
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      // Try to find Hindi voice
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => v.lang.includes('hi')) || voices.find(v => v.lang.includes('en-IN'));
      if (hindiVoice) utterance.voice = hindiVoice;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const stop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };
  
  return { speak, stop, isSpeaking };
};

export default function FreightExchange() {
  const [activeTab, setActiveTab] = useState<'loads' | 'trucks' | 'trends' | 'rate-engine'>('loads');
  const [loads, setLoads] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [surgeZones, setSurgeZones] = useState<any[]>([]);
  const [stats, setStats] = useState({ activeLoads: 0, availableTrucks: 0, liveAuctions: 0, activeBids: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [rateOrigin, setRateOrigin] = useState('Chennai');
  const [rateDestination, setRateDestination] = useState('Gurgaon');
  const [rateResult, setRateResult] = useState<any>(null);
  
  // AI Bot state
  const [botOpen, setBotOpen] = useState(false);
  const [botMessage, setBotMessage] = useState('');
  const [botHistory, setBotHistory] = useState<{role: string, text: string}[]>([
    { role: 'bot', text: 'नमस्ते! 🙏 I\'m your Freight Assistant. Ask me about rates, loads, or market trends! You can also use the 🎤 mic to speak.' }
  ]);
  
  // Voice hooks
  const { isListening, transcript, isSupported, toggleListening } = useVoiceInput();
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Update bot message when transcript changes
  useEffect(() => {
    if (transcript) {
      setBotMessage(transcript);
    }
  }, [transcript]);

  // Auto-send when user stops speaking
  useEffect(() => {
    if (!isListening && transcript && transcript.length > 2) {
      // Small delay to ensure final transcript is captured
      const timer = setTimeout(() => {
        sendBotMessage(transcript);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loadsRes, trucksRes, surgeRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/freight/loads`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/api/freight/trucks`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/api/freight/surge`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${API_BASE}/api/freight/stats`).then(r => r.ok ? r.json() : {}).catch(() => ({}))
      ]);
      setLoads(loadsRes); setTrucks(trucksRes); setSurgeZones(surgeRes); setStats(statsRes);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, []);

  const filteredLoads = loads.filter(l => 
    l.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.destination?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateRate = () => {
    const distance = rateOrigin === 'Chennai' && rateDestination === 'Gurgaon' ? 2100 : 1200;
    const baseRate = distance * 55;
    const fuelSurcharge = Math.round((92 - 85) * (distance / 4.5));
    const tollEstimate = distance * 8;
    const subtotal = (baseRate + fuelSurcharge) * 1.15 * 1.08 + tollEstimate;
    const gst = Math.round(subtotal * 0.12);
    setRateResult({ distance, baseRate, fuelSurcharge, tollEstimate, gst, total: Math.round(subtotal + gst), ratePerKm: Math.round((subtotal + gst) / distance) });
  };

  // AI Bot send message - REAL LLM with Voice
  const sendBotMessage = async (messageOverride?: string) => {
    const userMsg = messageOverride || botMessage;
    if (!userMsg.trim()) return;
    
    setBotHistory(h => [...h, { role: 'user', text: userMsg }]);
    setBotMessage('');
    setBotHistory(h => [...h, { role: 'bot', text: '💭 Thinking...' }]);
    
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          persona: 'freight',
          context: { stats }
        })
      });
      const data = await res.json();
      
      // Replace typing with real response
      setBotHistory(h => [...h.slice(0, -1), { role: 'bot', text: data.reply }]);
      
      // Speak the response if voice was used
      if (messageOverride && data.reply) {
        speak(data.reply);
      }
    } catch (err) {
      setBotHistory(h => [...h.slice(0, -1), { role: 'bot', text: '❌ Connection error. Please try again.' }]);
    }
  };

  const Sparkline = ({ data, color = '#f97316' }: { data: number[], color?: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => `${i * 14},${40 - ((v - min) / range) * 35}`).join(' ');
    return (
      <svg width="98" height="45" className="inline-block">
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        {data.map((v, i) => (
          <circle key={i} cx={i * 14} cy={40 - ((v - min) / range) * 35} r="3" fill={color} />
        ))}
      </svg>
    );
  };

  const handleStatClick = (tab: string) => {
    if (tab === 'loads') setActiveTab('loads');
    else if (tab === 'trucks') setActiveTab('trucks');
    else if (tab === 'trends') setActiveTab('trends');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Freight Exchange</h1>
            <p className="text-gray-400 text-sm">Live from Database • {loads.length} Loads • 🎤 Voice Enabled</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold">
            <Plus className="w-5 h-5" /> Post Load
          </button>
        </div>
      </div>

      {/* Stats Cards - Clickable */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Loads', value: stats.activeLoads || loads.length, color: 'text-orange-400', icon: Package, tab: 'loads' },
          { label: 'Available Trucks', value: stats.availableTrucks || trucks.length, color: 'text-green-400', icon: Truck, tab: 'trucks' },
          { label: 'Live Auctions', value: stats.liveAuctions || 0, color: 'text-purple-400', icon: Gavel, tab: 'loads' },
          { label: 'Active Bids', value: stats.activeBids || 0, color: 'text-blue-400', icon: IndianRupee, tab: 'trends' },
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={() => handleStatClick(s.tab)}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 cursor-pointer hover:border-orange-500/50 hover:bg-gray-800 transition-all group"
          >
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
              <s.icon className="w-4 h-4 group-hover:text-orange-400 transition-colors" />{s.label}
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Click to view →</div>
          </div>
        ))}
      </div>

      {/* Surge */}
      {surgeZones.length > 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5 text-yellow-400" /><span className="font-semibold">Live Surge</span></div>
          <div className="grid grid-cols-4 gap-3">
            {surgeZones.map((z, i) => (
              <div key={i} className={`px-3 py-2 rounded-lg border ${getSurgeColor(z.surgeLevel)}`}>
                <div className="font-semibold text-sm">{z.origin} → {z.destination}</div>
                <div className="flex justify-between mt-1"><span className="text-xs opacity-75">{z.vehicleType || 'All'}</span><span className="font-bold">{z.multiplier}x</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700 pb-4">
        {[
          { key: 'loads', label: 'Load Board', icon: Package },
          { key: 'trucks', label: 'Trucks', icon: Truck },
          { key: 'trends', label: 'Market Trends', icon: BarChart3 },
          { key: 'rate-engine', label: 'Rate Calculator', icon: IndianRupee }
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${activeTab === t.key ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {loading && <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /><span className="ml-3">Loading...</span></div>}

      {/* LOADS TAB */}
      {activeTab === 'loads' && !loading && (
        <>
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search loads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg" />
          </div>
          <div className="space-y-4">
            {filteredLoads.map(load => (
              <div key={load.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-orange-500/50 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-orange-400 font-mono font-bold">{load.code}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(load.status)}`}>{load.status?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-semibold mb-2">
                      <MapPin className="w-5 h-5 text-green-500" />{load.origin}<span className="text-gray-500">→</span><MapPin className="w-5 h-5 text-red-500" />{load.destination}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span>🚛 {load.vehicleType}</span><span>⚖️ {load.weight} MT</span>{load.cargoType && <span>📦 {load.cargoType}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 mb-1">Budget</div>
                    <div className="text-xl font-bold">{formatCurrency(load.budgetMin)} - {formatCurrency(load.budgetMax)}</div>
                    <div className="flex items-center justify-end gap-1 mt-1 text-sm text-gray-400"><Users className="w-4 h-4" />{load.bidCount || 0} bids</div>
                    <button onClick={() => setSelectedLoad(load)} className="mt-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold hover:opacity-90 transition-opacity">Place Bid</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* TRUCKS TAB */}
      {activeTab === 'trucks' && !loading && (
        <div className="grid grid-cols-3 gap-4">
          {trucks.map(t => (
            <div key={t.id} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-green-500/50 transition-all">
              <div className="flex justify-between mb-2"><span className="text-green-400 font-mono">{t.code}</span><span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(t.status)}`}>{t.status}</span></div>
              <div className="flex items-center gap-2 mb-2"><MapPin className="w-4 h-4 text-blue-500" /><span className="font-semibold">{t.location}</span></div>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-400 mb-3">
                <span>🚛 {t.vehicleType}</span><span>⚖️ {t.capacity} MT</span><span>💰 ₹{t.ratePerKm}/km</span><span>🔢 {t.vehicleNumber}</span>
              </div>
              <button className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">Book Now</button>
            </div>
          ))}
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'trends' && !loading && (
        <div className="space-y-4">
          <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-4 mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              Market Rate Trends (Last 7 Days)
            </h3>
            <p className="text-gray-400 text-sm">Track rate movements across popular lanes</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {TREND_DATA.map((trend, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{trend.lane}</h4>
                    <span className="text-sm text-gray-400">{trend.vehicle}</span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${trend.change >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {trend.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {Math.abs(trend.change)}%
                  </div>
                </div>
                <div className="mb-3"><Sparkline data={trend.days} color={trend.change >= 0 ? '#22c55e' : '#ef4444'} /></div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="bg-gray-900/50 rounded p-2 text-center">
                    <div className="text-gray-400 text-xs">Today</div>
                    <div className="font-bold text-white">{formatCurrency(trend.today)}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2 text-center">
                    <div className="text-gray-400 text-xs">Week Avg</div>
                    <div className="font-bold text-gray-300">{formatCurrency(trend.weekAvg)}</div>
                  </div>
                  <div className="bg-gray-900/50 rounded p-2 text-center">
                    <div className="text-gray-400 text-xs">₹/km</div>
                    <div className="font-bold text-orange-400">₹{Math.round(trend.today / (idx === 0 ? 2100 : idx === 1 ? 980 : idx === 2 ? 1450 : 660))}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RATE CALCULATOR TAB */}
      {activeTab === 'rate-engine' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><IndianRupee className="w-5 h-5 text-orange-400" />Rate Calculator</h3>
            <div className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Origin</label><select value={rateOrigin} onChange={e => setRateOrigin(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg"><option>Chennai</option><option>Mumbai</option><option>Delhi</option></select></div>
              <div><label className="block text-sm text-gray-400 mb-1">Destination</label><select value={rateDestination} onChange={e => setRateDestination(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg"><option>Gurgaon</option><option>Delhi</option><option>Kolkata</option></select></div>
              <button onClick={calculateRate} className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold">Calculate</button>
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
            {rateResult ? (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-gray-700 pb-2"><span>Distance</span><span>{rateResult.distance} km</span></div>
                <div className="flex justify-between border-b border-gray-700 pb-2"><span>Base Rate</span><span>{formatCurrency(rateResult.baseRate)}</span></div>
                <div className="flex justify-between border-b border-gray-700 pb-2"><span>Fuel</span><span className="text-yellow-400">+{formatCurrency(rateResult.fuelSurcharge)}</span></div>
                <div className="flex justify-between border-b border-gray-700 pb-2"><span>Tolls</span><span>+{formatCurrency(rateResult.tollEstimate)}</span></div>
                <div className="flex justify-between border-b border-gray-700 pb-2"><span>GST</span><span className="text-blue-400">+{formatCurrency(rateResult.gst)}</span></div>
                <div className="bg-orange-500/20 rounded-lg p-4 mt-4">
                  <div className="flex justify-between"><span className="font-semibold">Total</span><span className="text-2xl font-bold text-orange-400">{formatCurrency(rateResult.total)}</span></div>
                  <div className="text-right text-sm text-gray-400">₹{rateResult.ratePerKm}/km</div>
                </div>
              </div>
            ) : <p className="text-center py-12 text-gray-400">Click Calculate</p>}
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {selectedLoad && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Place Bid</h3>
            <p className="text-gray-400 mb-4">{selectedLoad.code}: {selectedLoad.origin} → {selectedLoad.destination}</p>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">Budget: {formatCurrency(selectedLoad.budgetMin)} - {formatCurrency(selectedLoad.budgetMax)}</div>
            <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder={selectedLoad.budgetMin} className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setSelectedLoad(null)} className="flex-1 py-2 bg-gray-700 rounded-lg">Cancel</button>
              <button className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg font-semibold">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* AI BOT - Floating Button */}
      <button 
        onClick={() => setBotOpen(!botOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-40"
      >
        {botOpen ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
      </button>

      {/* AI BOT - Chat Panel with Voice */}
      {botOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-40 overflow-hidden">
          {/* Bot Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">🤖</div>
              <div>
                <h4 className="font-bold text-white">Freight Saathi</h4>
                <p className="text-xs text-white/80">
                  {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : 'AI Assistant • Voice Enabled'}
                </p>
              </div>
              {isSupported && (
                <div className="ml-auto flex gap-2">
                  {isSpeaking && (
                    <button onClick={stop} className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                      <Volume2 className="w-4 h-4 text-white animate-pulse" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {botHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm whitespace-pre-line ${
                  msg.role === 'user' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-800 text-gray-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input with Voice */}
          <div className="p-3 border-t border-gray-700">
            {/* Voice indicator */}
            {isListening && (
              <div className="mb-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-center">
                <span className="text-red-400 text-sm animate-pulse">🎤 Listening... Speak now!</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <input 
                type="text" 
                value={botMessage}
                onChange={e => setBotMessage(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && sendBotMessage()}
                placeholder={isListening ? "Listening..." : "Type or use mic..."}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                disabled={isListening}
              />
              <button 
                onClick={() => sendBotMessage()} 
                className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
                disabled={isListening || !botMessage.trim()}
              >
                <Send className="w-4 h-4 text-white" />
              </button>
              
              {/* Voice Button */}
              {isSupported ? (
                <button 
                  onClick={toggleListening}
                  className={`p-2 rounded-lg transition-all ${
                    isListening 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  title={isListening ? "Stop listening" : "Start voice input"}
                >
                  {isListening ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-white" />}
                </button>
              ) : (
                <button 
                  className="p-2 bg-gray-700 rounded-lg opacity-50 cursor-not-allowed"
                  title="Voice not supported in this browser"
                >
                  <Mic className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
            
            {/* Voice hint */}
            {isSupported && !isListening && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                💡 Tip: Click 🎤 and speak in Hindi or English
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
