/**
 * Flow Canvas - Individual Lane
 *
 * A single Kanban lane (stage) with drop zone
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FlowStageData } from '../../types/flow-canvas';
import FlowEntityCard from './FlowEntityCard';

interface FlowLaneProps {
  stage: FlowStageData;
  flowColor: string;
  index: number;
}

/**
 * Flow Lane Component
 */
export default function FlowLane({ stage, flowColor, index }: FlowLaneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const entityIds = stage.entities.map((e) => e.id);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex-shrink-0 w-80"
    >
      {/* Lane Header */}
      <div
        className="rounded-t-lg px-4 py-3 border-2 border-b-0"
        style={{
          backgroundColor: stage.color || flowColor,
          borderColor: flowColor,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{stage.name}</h3>
            <p className="text-xs text-gray-600 mt-1">
              {stage.count} {stage.count === 1 ? 'item' : 'items'}
            </p>
          </div>

          {/* Alert Badge */}
          {stage.alertCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
              <span>⚠</span>
              <span>{stage.alertCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[500px] bg-gray-50 rounded-b-lg border-2 border-t-0 p-3 transition-colors
          ${isOver ? 'bg-blue-50 border-blue-400' : 'border-gray-200'}
        `}
        style={isOver ? { borderColor: flowColor } : {}}
      >
        <SortableContext items={entityIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {stage.entities.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No items</p>
                <p className="text-xs mt-1">Drag items here</p>
              </div>
            ) : (
              stage.entities.map((entity) => (
                <FlowEntityCard key={entity.id} entity={entity} />
              ))
            )}
          </div>
        </SortableContext>

        {/* Drop Hint */}
        {isOver && (
          <div className="mt-3 p-3 bg-blue-100 border-2 border-dashed border-blue-400 rounded-lg text-center">
            <p className="text-sm text-blue-700 font-medium">Drop to move here</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
