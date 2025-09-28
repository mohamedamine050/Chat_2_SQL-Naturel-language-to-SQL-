import React, { useEffect, useState, useMemo, useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
} from "react-flow-renderer";
import Sidebar from "../components/SideBar";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 140;

// Composant pour chaque table (node)
const TableNode = ({ data, selected }) => {
  return (
    <div
      className={`table-node ${selected ? 'selected' : ''}`}
      style={{
        padding: 16,
        border: selected ? "2px solid #3b82f6" : "1px solid #e5e7eb",
        borderRadius: 12,
        background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        fontSize: 13,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        boxShadow: selected 
          ? "0 10px 25px -3px rgba(59, 130, 246, 0.3), 0 4px 6px -2px rgba(59, 130, 246, 0.15)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        transition: "all 0.2s ease-in-out",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{
        borderBottom: "1px solid #e5e7eb",
        paddingBottom: 8,
        marginBottom: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 8,
            height: 8,
            backgroundColor: data.connectionCount > 2 ? "#ef4444" : data.connectionCount > 0 ? "#f59e0b" : "#10b981",
            borderRadius: "50%"
          }} />
          <strong style={{ 
            color: "#111827", 
            fontSize: 14,
            fontWeight: 600,
          }}>
            {data.label}
          </strong>
        </div>
        {data.connectionCount > 0 && (
          <span style={{
            fontSize: 10,
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 500
          }}>
            {data.connectionCount} liens
          </span>
        )}
      </div>

      {/* Colonnes */}
      <div style={{ 
        maxHeight: 80, 
        overflowY: "auto",
        paddingRight: 4
      }}>
        {data.columns.map((col, index) => (
          <div 
            key={col} 
            style={{
              padding: "2px 6px",
              margin: "2px 0",
              backgroundColor: index === 0 ? "#fef3c7" : "transparent",
              borderRadius: 4,
              fontSize: 11,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            {index === 0 && (
              <span style={{ color: "#f59e0b", fontSize: 10 }}>🔑</span>
            )}
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {col}
            </span>
          </div>
        ))}
      </div>

      {/* Handles pour les liens */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ 
          background: "#6366f1",
          width: 8,
          height: 8,
          border: "2px solid #ffffff",
          boxShadow: "0 2px 4px rgba(99, 102, 241, 0.3)"
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ 
          background: "#ef4444",
          width: 8,
          height: 8,
          border: "2px solid #ffffff",
          boxShadow: "0 2px 4px rgba(239, 68, 68, 0.3)"
        }}
      />
    </div>
  );
};

const LoadingSpinner = () => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 400,
    gap: 16
  }}>
    <div style={{
      width: 40,
      height: 40,
      border: "3px solid #e5e7eb",
      borderTop: "3px solid #3b82f6",
      borderRadius: "50%",
      animation: "spin 1s linear infinite"
    }} />
    <p style={{ 
      color: "#6b7280", 
      fontSize: 14,
      fontFamily: "'Inter', sans-serif"
    }}>
      Chargement du schéma de base de données...
    </p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

const ErrorMessage = ({ error, onRetry }) => (
  <div style={{
    padding: 24,
    backgroundColor: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 12,
    textAlign: "center",
    maxWidth: 500,
    margin: "0 auto"
  }}>
    <div style={{ color: "#dc2626", fontSize: 16, marginBottom: 8 }}>
      ⚠️ Erreur de chargement
    </div>
    <p style={{ color: "#7f1d1d", fontSize: 14, marginBottom: 16 }}>
      {error || "Impossible de charger le schéma de base de données"}
    </p>
    <button
      onClick={onRetry}
      style={{
        padding: "8px 16px",
        backgroundColor: "#dc2626",
        color: "white",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500
      }}
    >
      Réessayer
    </button>
  </div>
);

const SchemaDiagram = ({ schema }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const createNodes = useMemo(() => {
    if (!schema?.tables?.length) return [];

    const connectionCounts = {};
    schema.tables.forEach(table => {
      connectionCounts[table.name] = (table.foreignKeys?.length || 0);
      table.foreignKeys?.forEach(fk => {
        const targetTable = fk.references.split(".")[0];
        connectionCounts[targetTable] = (connectionCounts[targetTable] || 0) + 1;
      });
    });

    const sortedTables = [...schema.tables].sort((a, b) =>
      (connectionCounts[b.name] || 0) - (connectionCounts[a.name] || 0)
    );

    const radius = Math.max(300, sortedTables.length * 30);
    const centerX = radius;
    const centerY = radius;

    return sortedTables.map((table, idx) => {
      let x, y;

      if (idx === 0 && sortedTables.length > 1) {
        x = centerX;
        y = centerY;
      } else {
        const angle = (2 * Math.PI * (idx - 1)) / Math.max(1, sortedTables.length - 1);
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }

      return {
        id: table.name,
        type: "tableNode",
        data: {
          label: table.name,
          columns: table.columns,
          connectionCount: connectionCounts[table.name] || 0
        },
        position: { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 },
        style: { width: NODE_WIDTH, height: NODE_HEIGHT },
      };
    });
  }, [schema]);

  const createEdges = useMemo(() => {
    if (!schema?.tables?.length) return [];

    const edgeList = [];
    const edgeColors = [
      "#ef4444", "#3b82f6", "#10b981", "#f59e0b",
      "#8b5cf6", "#06b6d4", "#84cc16", "#f97316"
    ];

    let colorIndex = 0;

    schema.tables.forEach((table) => {
      table.foreignKeys?.forEach((fk, i) => {
        const source = table.name;
        const target = fk.references.split(".")[0];
        const color = edgeColors[colorIndex % edgeColors.length];

        edgeList.push({
          id: `e-${source}-${target}-${i}`,
          source,
          target,
          animated: false,
          label: `${fk.column}`,
          style: {
            stroke: color,
            strokeWidth: 3,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          },
          labelStyle: {
            fontSize: 12,
            fill: color,
            fontWeight: 700,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            padding: "4px 8px",
            borderRadius: 6,
            border: `1px solid ${color}`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
          },
          labelBgStyle: {
            fill: "rgba(255, 255, 255, 0.95)",
            stroke: color,
            strokeWidth: 1,
            rx: 6,
            ry: 6
          },
          markerEnd: {
            type: "arrowclosed",
            color: color,
            width: 12,
            height: 12
          },
          type: "bezier",
          pathOptions: {
            offset: i * 20,
            curvature: 0.3
          }
        });

        colorIndex++;
      });
    });
    return edgeList;
  }, [schema]);

  useEffect(() => {
    setNodes(createNodes);
    setEdges(createEdges);
  }, [createNodes, createEdges, setNodes, setEdges]);

  const nodeTypes = {
    tableNode: TableNode,
  };

  return (
    <div
      style={{
        height: 800,
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        backgroundColor: "#ffffff",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
        position: "relative"
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        attributionPosition="bottom-left"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <MiniMap
          nodeStrokeColor={() => "#3b82f6"}
          nodeColor={() => "#dbeafe"}
          nodeBorderRadius={8}
          maskColor="rgba(0, 0, 0, 0.1)"
          style={{
            backgroundColor: "#f8fafc",
            border: "1px solid #e5e7eb",
            borderRadius: 8
          }}
        />
        <Controls
          style={{
            button: {
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 6
            }
          }}
        />
        <Background
          color="#e5e7eb"
          gap={24}
          size={1}
          variant="dots"
        />
      </ReactFlow>
    </div>
  );
};

export default function SchemaPage() {
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSchema = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/affiche_schema");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Schema fetched:", data);  // debug
      setSchemaData(data);  // IMPORTANT: data, pas data.schema
    } catch (err) {
      console.error("Fetch schema error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f9fafb" }}>
      <Sidebar />
      <main
        style={{
          flexGrow: 1,
          padding: 32,
          backgroundColor: "#f9fafb",
          overflow: "auto",
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 32,
            fontWeight: 700,
            color: "#111827",
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}>
            Schéma de Base de Données
          </h1>
          <p style={{
            margin: 0,
            fontSize: 16,
            color: "#6b7280",
            fontFamily: "'Inter', sans-serif"
          }}>
            Visualisation interactive des tables et relations
          </p>

          {schemaData && (
            <div style={{
              display: "flex",
              gap: 24,
              marginTop: 16
            }}>
              <div style={{
                padding: "8px 16px",
                backgroundColor: "#dbeafe",
                borderRadius: 8,
                fontSize: 14,
                color: "#1e40af",
                fontWeight: 500
              }}>
                📊 {schemaData.tables?.length || 0} tables
              </div>
              <div style={{
                padding: "8px 16px",
                backgroundColor: "#dcfce7",
                borderRadius: 8,
                fontSize: 14,
                color: "#166534",
                fontWeight: 500
              }}>
                🔗 {schemaData.tables?.reduce((acc, table) => acc + (table.foreignKeys?.length || 0), 0) || 0} relations
              </div>
            </div>
          )}
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorMessage error={error} onRetry={fetchSchema} />}
        {schemaData && !loading && !error && (
          <SchemaDiagram schema={schemaData} />
        )}
      </main>
    </div>
  );
}
