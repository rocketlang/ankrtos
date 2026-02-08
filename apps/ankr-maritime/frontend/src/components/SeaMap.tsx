import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { generateIslands, generateConnections, archipelagos, Island } from '../lib/sea-map-data';
import { useAISearchStore } from '../lib/stores/aiSearchStore';

// Custom Island Node Component
function IslandNode({ data }: { data: Island }) {
  const navigate = useNavigate();

  const sizeStyles = {
    small: 'w-16 h-16 text-xs',
    medium: 'w-24 h-24 text-sm',
    large: 'w-32 h-32 text-base',
  };

  return (
    <div
      onClick={() => navigate(data.href)}
      className={`${sizeStyles[data.size]} cursor-pointer relative group`}
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
      }}
    >
      {/* Island Body */}
      <div
        className="w-full h-full rounded-full transition-transform duration-300 group-hover:scale-110 flex items-center justify-center relative"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${data.color}, ${data.color}dd)`,
          border: '3px solid rgba(255, 255, 255, 0.3)',
        }}
      >
        {/* Icon */}
        <div className="text-3xl">{data.icon}</div>

        {/* Glow effect on hover */}
        <div
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at center, ${data.color}88, transparent)`,
            filter: 'blur(8px)',
            transform: 'scale(1.2)',
          }}
        />
      </div>

      {/* Label */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <div className="bg-maritime-900/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-maritime-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-white text-xs font-medium text-center">{data.label}</p>
        </div>
      </div>

      {/* Ripple effect */}
      <div className="absolute inset-0 rounded-full animate-ping opacity-0 group-hover:opacity-20 pointer-events-none"
           style={{ backgroundColor: data.color }} />
    </div>
  );
}

const nodeTypes = {
  island: IslandNode,
};

export default function SeaMap() {
  const navigate = useNavigate();
  const [islands] = useState(() => generateIslands());
  const [connections] = useState(() => generateConnections(islands));

  // Convert to React Flow format
  const initialNodes: Node[] = islands.map((island) => ({
    id: island.id,
    type: 'island',
    position: island.position,
    data: island,
    draggable: false,
  }));

  const initialEdges: Edge[] = connections.map((conn, idx) => ({
    id: `${conn.from}-${conn.to}-${idx}`,
    source: conn.from,
    target: conn.to,
    type: 'straight',
    animated: false,
    style: {
      stroke: '#1e40af33',
      strokeWidth: 2,
      strokeDasharray: '5 5',
    },
    markerEnd: {
      type: MarkerType.Arrow,
      width: 20,
      height: 20,
      color: '#1e40af33',
    },
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Listen to AI search to pan to islands
  const { result } = useAISearchStore();

  useEffect(() => {
    if (result?.page) {
      // Find the island matching the search result
      const island = islands.find((i) => i.href === result.page);
      if (island) {
        // Pan to island (would use reactFlowInstance.setCenter in real implementation)
        console.log('[SeaMap] Navigating to island:', island.label);
      }
    }
  }, [result, islands]);

  const [selectedArchipelago, setSelectedArchipelago] = useState<string | null>(null);

  const handleArchipelagoClick = (archipelagoId: string) => {
    setSelectedArchipelago(archipelagoId === selectedArchipelago ? null : archipelagoId);
  };

  return (
    <div className="w-full h-screen relative bg-gradient-to-b from-blue-950 via-blue-900 to-cyan-950">
      {/* Animated Ocean Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-20">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                width: Math.random() * 100 + 50,
                height: Math.random() * 100 + 50,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 5}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        className="bg-transparent"
      >
        <Background
          gap={40}
          size={2}
          color="#1e3a8a22"
          style={{ opacity: 0.3 }}
        />

        {/* Mini Map */}
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as Island;
            return data.color;
          }}
          className="bg-maritime-900/80 backdrop-blur-sm border-2 border-cyan-500/30 rounded-xl"
          style={{
            backgroundColor: '#172554dd',
          }}
        />

        {/* Controls */}
        <Controls
          className="bg-maritime-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl"
          style={{
            button: {
              backgroundColor: '#1e3a8a',
              borderBottom: '1px solid #1e40af',
            },
          }}
        />

        {/* Legend Panel */}
        <Panel position="top-left" className="bg-maritime-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 max-w-sm">
          <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
            🗺️ Mari8X Ocean Map
          </h3>
          <p className="text-blue-200 text-xs mb-4">
            Navigate the seas of maritime operations. Each island is a service.
            Click to sail there!
          </p>

          {/* Archipelago List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {archipelagos.map((arch) => (
              <button
                key={arch.id}
                onClick={() => handleArchipelagoClick(arch.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors ${
                  selectedArchipelago === arch.id
                    ? 'bg-maritime-700'
                    : 'bg-maritime-800/50 hover:bg-maritime-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{arch.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {arch.label}
                    </p>
                    <p className="text-blue-300 text-xs truncate">
                      {arch.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-4 pt-4 border-t border-maritime-700 grid grid-cols-2 gap-2 text-center">
            <div>
              <div className="text-2xl font-bold text-cyan-400">{islands.length}</div>
              <div className="text-xs text-blue-300">Islands</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">{archipelagos.length}</div>
              <div className="text-xs text-blue-300">Archipelagos</div>
            </div>
          </div>
        </Panel>

        {/* Ship Cursor Hint */}
        <Panel position="bottom-center" className="bg-maritime-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-full px-6 py-2">
          <p className="text-white text-sm flex items-center gap-2">
            <span className="text-xl animate-bounce">⛵</span>
            <span>Sail to any island to explore that service</span>
          </p>
        </Panel>
      </ReactFlow>
    </div>
  );
}
