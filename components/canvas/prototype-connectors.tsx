"use client";

import React, { useMemo } from "react";
import { usePrototype, PrototypeLink } from "@/context/prototype-context";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface ConnectorArrowProps {
  link: PrototypeLink;
  fromPos: { x: number; y: number; width: number; height: number };
  toPos: { x: number; y: number; width: number; height: number };
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

// Calculate bezier curve path between two screens
function calculateConnectorPath(
  fromPos: { x: number; y: number; width: number; height: number },
  toPos: { x: number; y: number; width: number; height: number },
  fromElementPos?: { x: number; y: number; width: number; height: number }
): { path: string; startX: number; startY: number; endX: number; endY: number } {
  // Calculate centers
  const toCenterX = toPos.x + toPos.width / 2;
  const toCenterY = toPos.y + toPos.height / 2;

  let startX: number, startY: number, endX: number, endY: number;

  // If element position is provided, use it as the starting point
  if (fromElementPos) {
    // Element position is relative to the overlay/iframe area
    // The overlay is positioned over the iframe, which is inside the device frame
    // Device frame structure: Rnd -> container -> (title) -> rounded div -> white bg div -> iframe/overlay
    // The element position is relative to the overlay (white bg div), so we need to add:
    // - Screen position (Rnd position)
    // - Title offset in prototype mode (~40px: mb-2 margin + title height)
    // - Rounded container padding/border (minimal, ~0-2px)
    // For simplicity, we'll use a small offset to account for title and padding
    const frameContentOffset = 42; // Title area + small padding offset
    
    // Calculate absolute element position on canvas
    const elementLeft = fromPos.x + fromElementPos.x;
    const elementRight = fromPos.x + fromElementPos.x + fromElementPos.width;
    const elementTop = fromPos.y + frameContentOffset + fromElementPos.y;
    const elementBottom = fromPos.y + frameContentOffset + fromElementPos.y + fromElementPos.height;
    const elementCenterX = (elementLeft + elementRight) / 2;
    const elementCenterY = (elementTop + elementBottom) / 2;
    
    // Calculate direction to target
    const dx = toCenterX - elementCenterX;
    const dy = toCenterY - elementCenterY;
    
    // Determine which edge of the element to connect from
    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        // Target is to the right - connect from right edge of element
        startX = elementRight;
        startY = elementCenterY;
      } else {
        // Target is to the left - connect from left edge of element
        startX = elementLeft;
        startY = elementCenterY;
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        // Target is below - connect from bottom edge of element
        startX = elementCenterX;
        startY = elementBottom;
      } else {
        // Target is above - connect from top edge of element
        startX = elementCenterX;
        startY = elementTop;
      }
    }
  } else {
    // Fallback to screen center/edge connection (old behavior)
    const fromCenterX = fromPos.x + fromPos.width / 2;
    const fromCenterY = fromPos.y + fromPos.height / 2;
    const dx = toCenterX - fromCenterX;
    const dy = toCenterY - fromCenterY;

    // Connect from right side of source to left side of target (horizontal layout)
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        // Target is to the right
        startX = fromPos.x + fromPos.width;
        startY = fromCenterY;
      } else {
        // Target is to the left
        startX = fromPos.x;
        startY = fromCenterY;
      }
    } else {
      if (dy > 0) {
        // Target is below
        startX = fromCenterX;
        startY = fromPos.y + fromPos.height;
      } else {
        // Target is above
        startX = fromCenterX;
        startY = fromPos.y;
      }
    }
  }

  // Determine which side of target to connect to
  const finalDx = toCenterX - startX;
  const finalDy = toCenterY - startY;

  if (Math.abs(finalDx) > Math.abs(finalDy)) {
    if (finalDx > 0) {
      // Target is to the right
      endX = toPos.x;
      endY = toCenterY;
    } else {
      // Target is to the left
      endX = toPos.x + toPos.width;
      endY = toCenterY;
    }
  } else {
    if (finalDy > 0) {
      // Target is below
      endX = toCenterX;
      endY = toPos.y;
    } else {
      // Target is above
      endX = toCenterX;
      endY = toPos.y + toPos.height;
    }
  }

  // Calculate control points for smooth bezier curve
  const controlOffset = Math.min(Math.abs(endX - startX), Math.abs(endY - startY)) * 0.5 + 60;
  
  let cp1x: number, cp1y: number, cp2x: number, cp2y: number;

  if (Math.abs(finalDx) > Math.abs(finalDy)) {
    // Horizontal connection
    cp1x = startX + (finalDx > 0 ? controlOffset : -controlOffset);
    cp1y = startY;
    cp2x = endX + (finalDx > 0 ? -controlOffset : controlOffset);
    cp2y = endY;
  } else {
    // Vertical connection
    cp1x = startX;
    cp1y = startY + (finalDy > 0 ? controlOffset : -controlOffset);
    cp2x = endX;
    cp2y = endY + (finalDy > 0 ? -controlOffset : controlOffset);
  }

  const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  return { path, startX, startY, endX, endY };
}

const ConnectorArrow: React.FC<ConnectorArrowProps> = ({
  link,
  fromPos,
  toPos,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const { path, endX, endY, startX, startY } = useMemo(
    () => calculateConnectorPath(fromPos, toPos, link.fromElementPosition),
    [fromPos, toPos, link.fromElementPosition]
  );

  // Calculate arrow head rotation
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Calculate midpoint for delete button and label
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  const primaryColor = "#6366f1";

  return (
    <g className="connector-group">
      {/* Invisible wider path for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="cursor-pointer"
        onClick={onSelect}
      />
      
      {/* Visible connector path - thinner and solid color */}
      <path
        d={path}
        fill="none"
        stroke={primaryColor}
        strokeWidth={2}
        strokeLinecap="round"
        onClick={onSelect}
        className="cursor-pointer"
      />

      {/* Starting circle indicator - smaller */}
      <circle
        cx={startX}
        cy={startY}
        r={5}
        fill={primaryColor}
        className="cursor-pointer"
        onClick={onSelect}
      />

      {/* Arrow head at the end - pointing at target */}
      <g transform={`translate(${endX}, ${endY}) rotate(${angle})`}>
        <polygon
          points="-12,-6 0,0 -12,6"
          fill={primaryColor}
          className="cursor-pointer"
          onClick={onSelect}
        />
      </g>

      {/* Connection label at midpoint - removed for cleaner look */}

      {/* Delete button (only shown when selected) */}
      {isSelected && (
        <g
          transform={`translate(${midX + 40}, ${midY})`}
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <circle
            r={14}
            fill="#ef4444"
            stroke="white"
            strokeWidth={2}
            className="hover:fill-red-600 transition-colors"
          />
          <g transform="translate(-6, -6)">
            <HugeiconsIcon icon={Cancel01Icon} size={12} color="white" strokeWidth={2} />
          </g>
        </g>
      )}
    </g>
  );
};

// Drag connector while linking
interface DragConnectorProps {
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
}

const DragConnector: React.FC<DragConnectorProps> = ({ startPos, endPos }) => {
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;
  
  const controlOffset = Math.min(Math.abs(dx), Math.abs(dy)) * 0.3 + 40;
  
  const cp1x = startPos.x + controlOffset;
  const cp1y = startPos.y;
  const cp2x = endPos.x - controlOffset;
  const cp2y = endPos.y;

  const path = `M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <g className="drag-connector">
      {/* Connector path - thinner, no shadow */}
      <path
        d={path}
        fill="none"
        stroke="#6366f1"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="8 4"
        style={{
          animation: "dashMove 0.5s linear infinite",
        }}
      />
      
      {/* Start circle - smaller */}
      <circle
        cx={startPos.x}
        cy={startPos.y}
        r={5}
        fill="#6366f1"
      />

      {/* Arrow head at the end - pointing at target */}
      <g transform={`translate(${endPos.x}, ${endPos.y}) rotate(${angle})`}>
        <polygon
          points="-12,-6 0,0 -12,6"
          fill="#6366f1"
        />
      </g>
    </g>
  );
};

// Screen label component to show names
interface ScreenLabelProps {
  screenId: string;
  pos: { x: number; y: number; width: number; height: number };
  label: string;
  isSource: boolean;
}

const ScreenLabel: React.FC<ScreenLabelProps> = ({ pos, label, isSource }) => {
  return (
    <g>
      {/* Label background */}
      <rect
        x={pos.x + pos.width / 2 - 40}
        y={pos.y - 30}
        width={80}
        height={22}
        rx={11}
        fill={isSource ? "#6366f1" : "#10b981"}
        opacity={0.9}
      />
      {/* Label text */}
      <text
        x={pos.x + pos.width / 2}
        y={pos.y - 15}
        textAnchor="middle"
        fill="white"
        fontSize={10}
        fontWeight={600}
        style={{ pointerEvents: "none" }}
      >
        {label.slice(0, 10)}{label.length > 10 ? "..." : ""}
      </text>
    </g>
  );
};

// Main connector overlay component
interface PrototypeConnectorsProps {
  canvasScale: number;
}

const PrototypeConnectors: React.FC<PrototypeConnectorsProps> = ({ canvasScale }) => {
  const {
    mode,
    links,
    linkingState,
    screenPositions,
    selectedLinkId,
    setSelectedLinkId,
    removeLink,
  } = usePrototype();

  // Get unique screens that have links
  const linkedScreens = useMemo(() => {
    const screens = new Map<string, { pos: { x: number; y: number; width: number; height: number }; isSource: boolean; isTarget: boolean }>();
    
    links.forEach((link) => {
      const fromPos = screenPositions.get(link.fromScreenId);
      const toPos = screenPositions.get(link.toScreenId);
      
      if (fromPos) {
        const existing = screens.get(link.fromScreenId);
        screens.set(link.fromScreenId, {
          pos: fromPos,
          isSource: true,
          isTarget: existing?.isTarget || false
        });
      }
      if (toPos) {
        const existing = screens.get(link.toScreenId);
        screens.set(link.toScreenId, {
          pos: toPos,
          isSource: existing?.isSource || false,
          isTarget: true
        });
      }
    });
    
    return screens;
  }, [links, screenPositions]);

  if (mode !== "prototype") return null;

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        zIndex: 50,
      }}
    >
      <defs>
        <style>
          {`
            @keyframes dashMove {
              to {
                stroke-dashoffset: -12;
              }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.6; }
            }
          `}
        </style>
        {/* Arrow marker definition */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#6366f1"
          />
        </marker>
        <marker
          id="arrowhead-selected"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#3b82f6"
          />
        </marker>
      </defs>

      {/* Render all connector arrows */}
      <g className="connectors pointer-events-auto">
        {links.map((link) => {
          const fromPos = screenPositions.get(link.fromScreenId);
          const toPos = screenPositions.get(link.toScreenId);

          if (!fromPos || !toPos) return null;

          return (
            <ConnectorArrow
              key={link.id}
              link={link}
              fromPos={fromPos}
              toPos={toPos}
              isSelected={selectedLinkId === link.id}
              onSelect={() => setSelectedLinkId(link.id)}
              onDelete={() => removeLink(link.id)}
            />
          );
        })}
      </g>

      {/* Render drag connector when linking */}
      {linkingState.isLinking && linkingState.clickPosition && linkingState.mousePosition && (
        <DragConnector
          startPos={linkingState.clickPosition}
          endPos={linkingState.mousePosition}
        />
      )}

      {/* Show connection indicators on linked screens */}
      {links.length > 0 && (
        <g className="connection-indicators">
          {Array.from(linkedScreens.entries()).map(([screenId, { pos, isSource, isTarget }]) => (
            <g key={screenId}>
              {/* Highlight border for connected screens */}
              <rect
                x={pos.x - 4}
                y={pos.y - 4}
                width={pos.width + 8}
                height={pos.height + 8}
                rx={20}
                fill="none"
                stroke={isSource ? "#6366f1" : "#10b981"}
                strokeWidth={2}
                strokeDasharray={isTarget && !isSource ? "8 4" : "none"}
                opacity={0.5}
                style={{ pointerEvents: "none" }}
              />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
};

export default PrototypeConnectors;
