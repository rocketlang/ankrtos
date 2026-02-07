/**
 * Flow Canvas - Entity Card
 *
 * Draggable card representing a workflow entity
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FlowEntity } from '../../types/flow-canvas';
import { useFlowCanvasStore } from '../../lib/stores/flowCanvasStore';

interface FlowEntityCardProps {
  entity: FlowEntity;
  isDragging?: boolean;
}

/**
 * Flow Entity Card Component
 */
export default function FlowEntityCard({ entity, isDragging = false }: FlowEntityCardProps) {
  const { setSelectedEntity } = useFlowCanvasStore();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({
      id: entity.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    // Don't open drawer when dragging
    if (isSortableDragging) return;

    e.stopPropagation();
    setSelectedEntity(entity);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200
        hover:shadow-md hover:border-blue-400
        ${entity.alerts && entity.alerts > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200'}
        ${isDragging ? 'shadow-lg' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm">{entity.title}</h4>
          {entity.subtitle && (
            <p className="text-xs text-gray-600 mt-1">{entity.subtitle}</p>
          )}
        </div>

        {/* Drag Handle */}
        <div className="text-gray-400 cursor-grab active:cursor-grabbing ml-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>
      </div>

      {/* Metadata */}
      <div className="space-y-2">
        {/* Amount */}
        {entity.amount !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">💰</span>
            <span className="font-medium text-gray-900">
              ${entity.amount.toLocaleString()}
            </span>
          </div>
        )}

        {/* Date */}
        {entity.date && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">📅</span>
            <span className="text-gray-700">
              {new Date(entity.date).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📊</span>
          <span className="text-gray-700 capitalize">{entity.status.replace(/_/g, ' ')}</span>
        </div>
      </div>

      {/* Alerts */}
      {entity.alerts && entity.alerts > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>
              {entity.alerts} {entity.alerts === 1 ? 'alert' : 'alerts'}
            </span>
          </div>
        </div>
      )}

      {/* Click hint */}
      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
        Click to view details
      </div>
    </div>
  );
}
