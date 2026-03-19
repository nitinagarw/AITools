import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { intelligenceApi } from "@/services/api";
import { DataTable } from "@/components/common";
import type { GraphNode } from "@/types";

export function OrgGraphPage() {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    intelligenceApi
      .getGraph(id)
      .then((res) => {
        if (cancelled) return;
        setNodes(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setNodes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const nodeCount = nodes.length;
  const edgeCount = 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-slate-900">
          Knowledge Graph visualization
        </h3>
        <div className="mt-4 flex gap-6">
          <div>
            <p className="text-2xl font-bold text-slate-900">{nodeCount}</p>
            <p className="text-sm text-slate-500">Nodes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{edgeCount}</p>
            <p className="text-sm text-slate-500">Edges</p>
          </div>
        </div>
      </div>

      <div
        className="flex h-[500px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50"
        aria-label="Graph visualization placeholder"
      >
        <p className="text-center text-slate-500">
          Interactive graph visualization will render here when react-force-graph-2d
          is configured
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Graph Nodes</h3>
        <DataTable<GraphNode>
          columns={[
            { key: "entity_type", header: "Entity Type" },
            { key: "entity_name", header: "Entity Name" },
            {
              key: "properties",
              header: "Properties",
              render: (row) => (
                <span className="line-clamp-1 text-slate-600">
                  {Object.keys(row.properties || {}).length > 0
                    ? JSON.stringify(row.properties).slice(0, 80) + "..."
                    : "—"}
                </span>
              ),
            },
          ]}
          data={nodes}
          keyExtractor={(row) => row.id}
          loading={loading}
          emptyMessage="No graph nodes available"
        />
      </div>
    </div>
  );
}
