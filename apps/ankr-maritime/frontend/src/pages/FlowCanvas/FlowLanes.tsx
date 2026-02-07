/**
 * Flow Canvas - Kanban Lanes
 *
 * Drag-and-drop workflow lanes with entity cards
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FlowData, FlowDefinition, FlowEntity } from '../../types/flow-canvas';
import { useFlowCanvasStore } from '../../lib/stores/flowCanvasStore';
import FlowEntityCard from './FlowEntityCard';
import FlowLane from './FlowLane';

interface FlowLanesProps {
  flowData: FlowData;
  flowDefinition: FlowDefinition;
}

/**
 * Flow Lanes Component
 */
export default function FlowLanes({ flowData, flowDefinition }: FlowLanesProps) {
  const { moveEntity } = useFlowCanvasStore();
  const [activeEntity, setActiveEntity] = React.useState<FlowEntity | null>(null);

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const entity = findEntity(active.id as string);
    setActiveEntity(entity);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveEntity(null);
      return;
    }

    const entityId = active.id as string;
    const newStageId = over.id as string;

    // Move entity to new stage
    moveEntity(entityId, newStageId);
    setActiveEntity(null);
  };

  // Find entity by ID
  const findEntity = (entityId: string): FlowEntity | null => {
    for (const stage of flowData.stages) {
      const entity = stage.entities.find((e) => e.id === entityId);
      if (entity) return entity;
    }
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {flowData.stages.map((stage, index) => (
          <FlowLane
            key={stage.id}
            stage={stage}
            flowColor={flowDefinition.color}
            index={index}
          />
        ))}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeEntity ? (
          <div className="rotate-3 scale-105">
            <FlowEntityCard entity={activeEntity} isDragging={true} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
