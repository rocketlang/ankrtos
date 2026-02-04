/**
 * ankr AI Command Bar - Voice/Text NLP Interface
 * With REAL GraphQL mutations and navigation
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useLazyQuery, gql } from '@apollo/client';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAIStore } from '../stores/useAIStore';

// GraphQL Operations
const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      orderNumber
      status
      origin
      destination
    }
  }
`;

const GET_VEHICLES = gql`
  query GetVehicles($where: VehicleWhereInput) {
    vehicles(where: $where) {
      id
      vehicleNumber
      status
      lastLatitude
      lastLongitude
      driver { name phone }
    }
  }
`;

const GET_ORDERS = gql`
  query GetOrders($where: OrderWhereInput) {
    orders(where: $where) {
      id
      orderNumber
      status
      origin
      destination
    }
  }
`;

interface ParsedIntent {
  id: string;
  intent: 'action' | 'query' | 'codegen' | 'conversation';
  action?: string;
  confidence: number;
  entities: Record<string, any>;
  originalText: string;
  language: string;
  timestamp: Date;
}

interface AICommandBarProps {
  onIntentParsed?: (intent: ParsedIntent) => void;
  onActionExecuted?: (action: any) => void;
}

export function AICommandBar({ onIntentParsed, onActionExecuted }: AICommandBarProps) {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Zustand store
  const { addIntent, addAction, updateAction, stats } = useAIStore();

  // GraphQL mutations & queries
  const [createOrder] = useMutation(CREATE_ORDER);
  const [getVehicles] = useLazyQuery(GET_VEHICLES);
  const [getOrders] = useLazyQuery(GET_ORDERS);

  const bg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const muted = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const border = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  // Voice recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : lang === 'ta' ? 'ta-IN' : lang === 'te' ? 'te-IN' : lang === 'kn' ? 'kn-IN' : lang === 'mr' ? 'mr-IN' : 'en-IN';
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results).map((r: any) => r[0].transcript).join('');
        setInput(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) recognitionRef.current?.stop();
    else { recognitionRef.current?.start(); setIsListening(true); }
  }, [isListening]);

  // Parse intent
  const parseIntent = (text: string): ParsedIntent => {
    const id = `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const lowerText = text.toLowerCase();
    const hasHindi = /[\u0900-\u097F]/.test(text);
    
    let intent: ParsedIntent['intent'] = 'conversation';
    let action: string | undefined;
    let confidence = 0.5;
    const entities: Record<string, any> = {};

    // ACTION: Book/Create Order
    if (lowerText.match(/book|order|बुक|create order|shipment/)) {
      intent = 'action';
      action = 'create_order';
      confidence = 0.85;
      
      // Extract cities
      const cities = ['delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'faridabad'];
      const hindiCities: Record<string, string> = { 'दिल्ली': 'Delhi', 'मुंबई': 'Mumbai', 'बैंगलोर': 'Bangalore' };
      
      const foundCities: string[] = [];
      cities.forEach(city => {
        if (lowerText.includes(city)) foundCities.push(city.charAt(0).toUpperCase() + city.slice(1));
      });
      Object.entries(hindiCities).forEach(([hindi, english]) => {
        if (text.includes(hindi)) foundCities.push(english);
      });
      
      if (foundCities.length >= 2) {
        entities.origin = foundCities[0];
        entities.destination = foundCities[1];
      } else if (foundCities.length === 1) {
        entities.origin = foundCities[0];
        entities.destination = 'Mumbai'; // default
      } else {
        entities.origin = 'Delhi';
        entities.destination = 'Mumbai';
      }
      
      // Extract weight
      const weightMatch = text.match(/(\d+)\s*(ton|kg|टन|mt)/i);
      if (weightMatch) {
        entities.weight = parseInt(weightMatch[1]);
        entities.weightUnit = weightMatch[2].toLowerCase().replace('टन', 'ton');
      } else {
        entities.weight = 10;
        entities.weightUnit = 'ton';
      }
    }
    // QUERY: Show orders
    else if (lowerText.match(/show.*order|list.*order|pending.*order|orders/)) {
      intent = 'query';
      action = 'list_orders';
      confidence = 0.8;
      if (lowerText.includes('pending')) entities.status = 'PENDING';
      if (lowerText.includes('delivered')) entities.status = 'DELIVERED';
      if (lowerText.includes('transit')) entities.status = 'IN_TRANSIT';
    }
    // QUERY: Track vehicle
    else if (lowerText.match(/track|vehicle|truck|गाड़ी|where/)) {
      intent = 'query';
      action = 'track_vehicle';
      confidence = 0.8;
      const vehicleMatch = text.match(/([A-Z]{2}\d{2}[A-Z]{1,2}\d{4})/i);
      if (vehicleMatch) entities.vehicleNumber = vehicleMatch[1].toUpperCase();
    }
    // QUERY: Show vehicles/fleet
    else if (lowerText.match(/show.*vehicle|list.*vehicle|fleet|trucks/)) {
      intent = 'query';
      action = 'list_vehicles';
      confidence = 0.8;
    }
    // CODEGEN: Create widget
    else if (lowerText.match(/create widget|generate|build component/)) {
      intent = 'codegen';
      action = 'create_widget';
      confidence = 0.8;
      entities.description = text;
    }

    return { id, intent, action, confidence, entities, originalText: text, language: hasHindi ? 'hi' : 'en', timestamp: new Date() };
  };

  // Execute action with REAL GraphQL
  const executeAction = async (intent: ParsedIntent): Promise<{ success: boolean; message: string; data?: any }> => {
    const { action, entities } = intent;

    try {
      switch (action) {
        case 'create_order': {
          const result = await createOrder({
            variables: {
              input: {
                origin: entities.origin || 'Delhi',
                destination: entities.destination || 'Mumbai',
                weight: entities.weight || 10,
                weightUnit: entities.weightUnit || 'ton',
                status: 'PENDING',
              }
            }
          });
          
          const order = result.data?.createOrder;
          if (order) {
            // Navigate to orders page
            setTimeout(() => navigate('/orders'), 1500);
            return { 
              success: true, 
              message: `✅ Order #${order.orderNumber} created! ${entities.origin} → ${entities.destination}`,
              data: order 
            };
          }
          return { success: false, message: '❌ Failed to create order' };
        }

        case 'list_orders': {
          const result = await getOrders({
            variables: entities.status ? { where: { status: entities.status } } : {}
          });
          
          const orders = result.data?.orders || [];
          // Navigate to orders page with filter
          const url = entities.status ? `/orders?status=${entities.status.toLowerCase()}` : '/orders';
          setTimeout(() => navigate(url), 500);
          return { 
            success: true, 
            message: `📦 Found ${orders.length} orders. Navigating...`,
            data: orders 
          };
        }

        case 'track_vehicle': {
          if (entities.vehicleNumber) {
            const result = await getVehicles({
              variables: { where: { vehicleNumber: entities.vehicleNumber } }
            });
            
            const vehicles = result.data?.vehicles || [];
            if (vehicles.length > 0) {
              setTimeout(() => navigate('/fleet'), 500);
              return { 
                success: true, 
                message: `🚛 Found ${entities.vehicleNumber}. Status: ${vehicles[0].status}`,
                data: vehicles[0] 
              };
            }
            return { success: false, message: `❌ Vehicle ${entities.vehicleNumber} not found` };
          }
          setTimeout(() => navigate('/fleet'), 500);
          return { success: true, message: '🚛 Opening fleet view...' };
        }

        case 'list_vehicles': {
          setTimeout(() => navigate('/vehicles'), 500);
          return { success: true, message: '🚛 Opening vehicles list...' };
        }

        case 'create_widget': {
          return { 
            success: true, 
            message: `🧩 Widget generation: "${entities.description}" (Coming soon!)` 
          };
        }

        default:
          return { success: false, message: `Unknown action: ${action}` };
      }
    } catch (error: any) {
      console.error('Action error:', error);
      return { success: false, message: `❌ Error: ${error.message}` };
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    setResponse('');

    try {
      // 1. Parse intent
      const intent = parseIntent(input);
      
      // 2. Store in Zustand + sync to ankr-eon
      await addIntent(intent);
      onIntentParsed?.(intent);

      // 3. Execute action or query
      if (intent.intent === 'action' || intent.intent === 'query') {
        const actionEvent = {
          id: `act_${Date.now()}`,
          intentId: intent.id,
          action: intent.action || 'unknown',
          status: 'pending' as const,
          startTime: new Date(),
        };
        
        addAction(actionEvent);
        updateAction(actionEvent.id, { status: 'executing' });
        
        // Execute with REAL GraphQL
        const result = await executeAction(intent);
        
        updateAction(actionEvent.id, { 
          status: result.success ? 'success' : 'failed',
          endTime: new Date(),
          duration: Date.now() - actionEvent.startTime.getTime(),
          result: result.data,
          error: result.success ? undefined : result.message,
        });
        
        setResponse(result.message);
        onActionExecuted?.(actionEvent);
      } else {
        // Conversation - just acknowledge
        setResponse(`💬 ${intent.intent.toUpperCase()} • ${Math.round(intent.confidence * 100)}%`);
      }

      setInput('');
    } catch (error: any) {
      setResponse(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const suggestions = [
    { text: 'Book truck Delhi to Mumbai 10 tons', icon: '📦' },
    { text: 'Show pending orders', icon: '⏳' },
    { text: 'Track vehicle MH01AB1234', icon: '📍' },
    { text: 'दिल्ली से मुंबई 10 टन ट्रक बुक करो', icon: '🇮🇳' },
    { text: 'Show fleet', icon: '🚛' },
  ];

  return (
    <div className={`${bg} rounded-lg border ${border} overflow-hidden`}>
      {/* Input Row - Compact */}
      <div className="flex items-center px-2 py-1.5 gap-2">
        <button onClick={toggleVoice} className={`p-1.5 rounded-lg transition ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
          {isListening ? '🎤' : '🎙️'}
        </button>
        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Ask anything... बोलो या टाइप करो..."
          className={`flex-1 bg-transparent ${text} placeholder-gray-500 outline-none text-sm`}
        />
        <div className="flex items-center gap-1.5">
          <div className="flex gap-0.5" title={`Actions: ${stats.totalActions} | Success: ${Math.round(stats.successRate)}%`}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          </div>
          <button onClick={handleSubmit} disabled={isProcessing || !input.trim()}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${isProcessing ? 'bg-gray-600 text-gray-400' : 'bg-orange-500 hover:bg-orange-600 text-white'}`}>
            {isProcessing ? '🧠' : '→'}
          </button>
        </div>
      </div>

      {/* Suggestion Pills - Compact */}
      {!input && (
        <div className={`border-t ${border} px-2 py-1 flex flex-wrap gap-1`}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s.text)} 
              className="text-[11px] px-2 py-0.5 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition flex items-center gap-1">
              <span>{s.icon}</span>
              <span className="truncate max-w-[140px]">{s.text}</span>
            </button>
          ))}
        </div>
      )}

      {/* Response - Compact */}
      {response && (
        <div className={`border-t ${border} px-2 py-1.5 text-xs ${text}`}>
          {response}
          <span className={`ml-2 ${muted}`}>• {stats.totalActions} actions</span>
        </div>
      )}
    </div>
  );
}

export default AICommandBar;
