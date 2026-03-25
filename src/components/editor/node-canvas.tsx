"use client";

import {
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Copy, MousePointerClick, RotateCcw, Trash2 } from "lucide-react";
import { TakdiNode } from "./takdi-node";
import { cn } from "@/lib/utils";
import {
  DEFAULT_MODE_CONFIG,
  MODE_NODE_CONFIG,
  NODE_TYPE_LABELS,
  type FlowNodeType,
} from "@/lib/constants";
import { WORKSPACE_SURFACE, WORKSPACE_TEXT } from "@/lib/workspace-surface";

interface ContextMenuState {
  nodeId: string;
  x: number;
  y: number;
}

const MAX_HISTORY = 50;
const HISTORY_DEBOUNCE_MS = 250;
const nodeTypes = { takdi: TakdiNode };

export interface NodeData {
  label: string;
  nodeType: string;
  status?: string;
  briefText?: string;
  ratio?: string;
  previewText?: string;
  previewImages?: string[];
  [key: string]: unknown;
}

export interface NodeCanvasHandle {
  updateNodeData: (nodeId: string, patch: Partial<NodeData>) => void;
  updateNodesByType: (nodeType: string, patch: Partial<NodeData>) => void;
  replaceGraph: (snapshot: CanvasSnapshot) => void;
  deleteSelectedNodes: () => void;
  getNodeCount: () => number;
  setEdgeGlow: (edgeId: string, state: "active" | "done" | "") => void;
  resetEdgeGlow: () => void;
}

interface NodeCanvasProps {
  mode: string;
  initialSnapshot?: CanvasSnapshot;
  className?: string;
  readOnlyStructure?: boolean;
  canInsertNodes?: boolean;
  canDuplicateNodes?: boolean;
  canEditEdges?: boolean;
  onRestrictionViolation?: (message: string) => void;
  onStateChange?: (nodes: Node[], edges: Edge[]) => void;
  onNodeSelect?: (nodeId: string | null, nodeData?: NodeData) => void;
}

interface CanvasSnapshot {
  nodes: Node[];
  edges: Edge[];
}

function buildInitialNodes(mode: string): CanvasSnapshot {
  const config = MODE_NODE_CONFIG[mode] ?? DEFAULT_MODE_CONFIG;
  const pipeline = config.initialPipeline;
  const startX = 100;
  const gapX = 300;

  const nodes: Node[] = pipeline.map((type, index) => ({
    id: `${index + 1}`,
    type: "takdi",
    position: { x: startX + index * gapX, y: 100 },
    data: { label: NODE_TYPE_LABELS[type], nodeType: type, status: "draft" },
  }));

  const edges: Edge[] = pipeline.slice(1).map((_, index) => ({
    id: `e${index + 1}-${index + 2}`,
    source: `${index + 1}`,
    target: `${index + 2}`,
  }));

  return { nodes, edges };
}

function cloneNodes(nodes: Node[]) {
  return nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: { ...(node.data as Record<string, unknown>) },
  }));
}

function cloneEdges(edges: Edge[]) {
  return edges.map((edge) => ({ ...edge }));
}

function createSnapshot(nodes: Node[], edges: Edge[]): CanvasSnapshot {
  return {
    nodes: cloneNodes(nodes),
    edges: cloneEdges(edges),
  };
}

function hashSnapshot(nodes: Node[], edges: Edge[]) {
  return JSON.stringify({
    nodes: nodes.map((node) => ({
      id: node.id,
      position: node.position,
      selected: node.selected ?? false,
      data: node.data,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      className: edge.className ?? "",
      animated: edge.animated ?? false,
    })),
  });
}

export const NodeCanvas = forwardRef<NodeCanvasHandle, NodeCanvasProps>(function NodeCanvas(
  {
    mode,
    initialSnapshot,
    className,
    readOnlyStructure = false,
    canInsertNodes = true,
    canDuplicateNodes = true,
    canEditEdges = true,
    onRestrictionViolation,
    onStateChange,
    onNodeSelect,
  },
  ref,
) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const initial = useRef(initialSnapshot ?? buildInitialNodes(mode));
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.current.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.current.edges);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const historyRef = useRef<CanvasSnapshot[]>([createSnapshot(initial.current.nodes, initial.current.edges)]);
  const historyIndexRef = useRef(0);
  const suppressHistoryRef = useRef(false);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHistoryHashRef = useRef(hashSnapshot(initial.current.nodes, initial.current.edges));

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useImperativeHandle(
    ref,
    () => ({
      updateNodeData(nodeId: string, patch: Partial<NodeData>) {
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            node.id === nodeId ? { ...node, data: { ...node.data, ...patch } } : node,
          ),
        );
      },
      updateNodesByType(nodeType: string, patch: Partial<NodeData>) {
        setNodes((currentNodes) =>
          currentNodes.map((node) =>
            (node.data as NodeData).nodeType === nodeType
              ? { ...node, data: { ...node.data, ...patch } }
              : node,
          ),
        );
      },
      replaceGraph(snapshot: CanvasSnapshot) {
        suppressHistoryRef.current = true;
        setNodes(cloneNodes(snapshot.nodes));
        setEdges(cloneEdges(snapshot.edges));
        onNodeSelect?.(null);
      },
      deleteSelectedNodes() {
        setNodes((currentNodes) => {
          const selectedIds = new Set(currentNodes.filter((node) => node.selected).map((node) => node.id));
          if (selectedIds.size === 0) {
            return currentNodes;
          }

          setEdges((currentEdges) =>
            currentEdges.filter((edge) => !selectedIds.has(edge.source) && !selectedIds.has(edge.target)),
          );

          return currentNodes.filter((node) => !node.selected);
        });
        onNodeSelect?.(null);
      },
      getNodeCount() {
        return nodesRef.current.length;
      },
      setEdgeGlow(edgeId: string, state: "active" | "done" | "") {
        setEdges((currentEdges) =>
          currentEdges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, className: state ? `glow-${state}` : "", animated: state === "active" }
              : edge,
          ),
        );
      },
      resetEdgeGlow() {
        setEdges((currentEdges) => currentEdges.map((edge) => ({ ...edge, className: "", animated: false })));
      },
    }),
    [onNodeSelect, setEdges, setNodes],
  );

  useEffect(() => {
    if (suppressHistoryRef.current) {
      suppressHistoryRef.current = false;
      lastHistoryHashRef.current = hashSnapshot(nodes, edges);
      return;
    }

    const nextHash = hashSnapshot(nodes, edges);
    if (nextHash === lastHistoryHashRef.current) {
      return;
    }

    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
    }

    historyTimerRef.current = setTimeout(() => {
      const latestNodes = nodesRef.current;
      const latestEdges = edgesRef.current;
      const latestHash = hashSnapshot(latestNodes, latestEdges);

      if (latestHash === lastHistoryHashRef.current) {
        return;
      }

      const nextSnapshot = createSnapshot(latestNodes, latestEdges);
      const trimmedHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
      trimmedHistory.push(nextSnapshot);

      if (trimmedHistory.length > MAX_HISTORY) {
        trimmedHistory.shift();
      }

      historyRef.current = trimmedHistory;
      historyIndexRef.current = trimmedHistory.length - 1;
      lastHistoryHashRef.current = latestHash;
    }, HISTORY_DEBOUNCE_MS);

    return () => {
      if (historyTimerRef.current) {
        clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
    };
  }, [edges, nodes]);

  useEffect(() => {
    return () => {
      if (historyTimerRef.current) {
        clearTimeout(historyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const element = event.target as HTMLElement;
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable) {
        return;
      }

      if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        const index = historyIndexRef.current;
        if (index <= 0) {
          return;
        }

        historyIndexRef.current = index - 1;
        suppressHistoryRef.current = true;
        const snapshot = historyRef.current[index - 1];
        setNodes(cloneNodes(snapshot.nodes));
        setEdges(cloneEdges(snapshot.edges));
      } else if (event.ctrlKey && event.shiftKey && event.key === "Z") {
        event.preventDefault();
        const index = historyIndexRef.current;
        if (index >= historyRef.current.length - 1) {
          return;
        }

        historyIndexRef.current = index + 1;
        suppressHistoryRef.current = true;
        const snapshot = historyRef.current[index + 1];
        setNodes(cloneNodes(snapshot.nodes));
        setEdges(cloneEdges(snapshot.edges));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setEdges, setNodes]);

  useEffect(() => {
    onStateChange?.(nodes, edges);
  }, [edges, nodes, onStateChange]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!canEditEdges) {
        onRestrictionViolation?.("가이드형 모드에서는 단계 연결을 바꿀 수 없어요.");
        return;
      }
      setEdges((currentEdges) => addEdge(params, currentEdges));
    },
    [canEditEdges, onRestrictionViolation, setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      if (!canInsertNodes) {
        onRestrictionViolation?.("가이드형 모드에서는 단계를 추가할 수 없어요.");
        return;
      }
      const type = event.dataTransfer.getData("application/reactflow-type") as FlowNodeType;
      const label = event.dataTransfer.getData("application/reactflow-label");
      if (!type) {
        return;
      }

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      const position = {
        x: event.clientX - (bounds?.left ?? 0),
        y: event.clientY - (bounds?.top ?? 0),
      };

      const newNode: Node = {
        id: `${Date.now()}`,
        type: "takdi",
        position,
        data: { label, nodeType: type, status: "draft" },
      };

      setNodes((currentNodes) => [...currentNodes, newNode]);
    },
    [canInsertNodes, onRestrictionViolation, setNodes],
  );

  const onNodeClick = useCallback(
    (_event: ReactMouseEvent, node: Node) => {
      onNodeSelect?.(node.id, node.data as NodeData);
    },
    [onNodeSelect],
  );

  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
    setContextMenu(null);
  }, [onNodeSelect]);

  const onNodeContextMenu = useCallback((event: ReactMouseEvent, node: Node) => {
    if (readOnlyStructure) {
      return;
    }
    event.preventDefault();
    const bounds = reactFlowWrapper.current?.getBoundingClientRect();
    setContextMenu({
      nodeId: node.id,
      x: event.clientX - (bounds?.left ?? 0),
      y: event.clientY - (bounds?.top ?? 0),
    });
  }, [readOnlyStructure]);

  const handleDuplicate = useCallback(() => {
    if (!contextMenu) {
      return;
    }
    if (!canDuplicateNodes) {
      onRestrictionViolation?.("가이드형 모드에서는 단계를 복제할 수 없어요.");
      setContextMenu(null);
      return;
    }

    const sourceNode = nodesRef.current.find((node) => node.id === contextMenu.nodeId);
    if (!sourceNode) {
      return;
    }

    const duplicatedNode: Node = {
      id: `${Date.now()}`,
      type: "takdi",
      position: { x: sourceNode.position.x + 50, y: sourceNode.position.y + 50 },
      data: { ...sourceNode.data, status: "draft" },
    };

    setNodes((currentNodes) => [...currentNodes, duplicatedNode]);
    setContextMenu(null);
  }, [canDuplicateNodes, contextMenu, onRestrictionViolation, setNodes]);

  const handleDeleteNode = useCallback(() => {
    if (!contextMenu) {
      return;
    }

    const nodeId = contextMenu.nodeId;
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId));
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    onNodeSelect?.(null);
    setContextMenu(null);
  }, [contextMenu, onNodeSelect, setEdges, setNodes]);

  const handleResetStatus = useCallback(() => {
    if (!contextMenu) {
      return;
    }

    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === contextMenu.nodeId ? { ...node, data: { ...node.data, status: "draft" } } : node,
      ),
    );
    setContextMenu(null);
  }, [contextMenu, setNodes]);

  return (
    <div ref={reactFlowWrapper} className={cn("relative h-full w-full", className)}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        deleteKeyCode={readOnlyStructure ? null : ["Delete", "Backspace"]}
        nodesDraggable={!readOnlyStructure}
        nodesConnectable={canEditEdges}
        elementsSelectable
        fitView
        className="bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_22%),linear-gradient(180deg,rgba(244,238,230,0.9),rgba(239,231,220,0.78))]"
      >
        <Background gap={20} size={1} color="#d9cec2" />
        <Controls className="rounded-2xl border border-[rgb(214_199_184_/_0.82)] bg-[rgb(255_252_247_/_0.84)] shadow-[0_12px_28px_rgba(55,40,30,0.08)] backdrop-blur-xl" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor="#D97C67"
          maskColor="rgba(0,0,0,0.08)"
          className="rounded-2xl border border-[rgb(214_199_184_/_0.82)] bg-[rgb(255_252_247_/_0.84)] shadow-[0_12px_28px_rgba(55,40,30,0.08)] backdrop-blur-xl"
        />
      </ReactFlow>

      {contextMenu && !readOnlyStructure ? (
        <div
          className="absolute z-50 min-w-[140px] rounded-2xl bg-[rgb(255_255_255_/_0.92)] py-1 shadow-lg ring-1 ring-[rgb(214_199_184_/_0.82)] backdrop-blur-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            onClick={handleDuplicate}
            className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${WORKSPACE_TEXT.body} hover:bg-[rgb(248_241_232_/_0.78)]`}
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </button>
          <button
            type="button"
            onClick={handleResetStatus}
            className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${WORKSPACE_TEXT.body} hover:bg-[rgb(248_241_232_/_0.78)]`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset status
          </button>
          <div className="my-1 h-px bg-[rgb(238_230_220_/_0.9)]" />
          <button
            type="button"
            onClick={handleDeleteNode}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}

      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`flex flex-col items-center gap-3 rounded-[28px] px-8 py-6 ${WORKSPACE_SURFACE.panelStrong}`}>
            <MousePointerClick className={`h-8 w-8 ${WORKSPACE_TEXT.accent}`} />
            <p className={`text-sm font-medium ${WORKSPACE_TEXT.body}`}>아직 캔버스가 비어있어요</p>
            <p className={`text-xs ${WORKSPACE_TEXT.muted}`}>왼쪽에서 단계를 드래그해서 추가해보세요.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
});
