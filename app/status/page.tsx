/**
 * app/status/page.tsx
 * ================================================================
 * Halaman status sistem - cek backend & NodeODM dengan detail lebih.
 * ================================================================
 */
"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiClientError } from "@/lib/api";
import type { HealthInfo, NodeODMInfo } from "@/lib/types";

export default function StatusPage() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [nodeodm, setNodeodm] = useState<NodeODMInfo | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [nodeodmError, setNodeodmError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    setHealthError(null);
    setNodeodmError(null);

    try {
      const h = await api.getHealth();
      setHealth(h);
    } catch (err) {
      setHealthError(err instanceof ApiClientError ? err.detail : "Backend tidak responsif");
      setHealth(null);
    }

    try {
      const n = await api.getNodeODMStatus();
      setNodeodm(n);
    } catch (err) {
      setNodeodmError(err instanceof ApiClientError ? err.detail : "NodeODM tidak responsif");
      setNodeodm(null);
    }

    setRefreshing(false);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Activity className="h-6 w-6" />
            Status Sistem
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitoring kesehatan backend dan NodeODM.
          </p>
        </div>
        <Button onClick={refresh} disabled={refreshing} variant="outline" size="sm">
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Backend FastAPI</span>
              <StatusBadge ok={!!health} />
            </CardTitle>
            <CardDescription>
              {api.baseUrl}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {healthError ? (
              <p className="text-sm text-red-700">{healthError}</p>
            ) : health ? (
              <dl className="space-y-2 text-sm">
                <Row label="Status" value={health.status} mono />
                <Row label="Timestamp server" value={health.timestamp} mono />
                <Row label="Output dir ada" value={String(health.output_dir_exists)} />
                <Row label="Active jobs" value={String(health.active_jobs)} />
                <Row label="Total jobs" value={String(health.total_jobs)} />
              </dl>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>NodeODM (Docker)</span>
              <StatusBadge ok={!!nodeodm} />
            </CardTitle>
            <CardDescription>
              Service stitching ODM
            </CardDescription>
          </CardHeader>
          <CardContent>
            {nodeodmError ? (
              <div className="space-y-2 text-sm text-red-700">
                <p>{nodeodmError}</p>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">
                  <strong>Solusi:</strong> Jalankan <code className="rounded bg-amber-200 px-1">start_nodeodm.bat</code> di folder backend, atau cek Docker Desktop.
                </div>
              </div>
            ) : nodeodm ? (
              <dl className="space-y-2 text-sm">
                <Row label="Versi" value={nodeodm.version} mono />
                <Row label="Engine" value={nodeodm.engine} />
                <Row label="Engine versi" value={nodeodm.engine_version} mono />
                <Row label="Max parallel tasks" value={String(nodeodm.max_parallel_tasks)} />
                <Row label="Task queue" value={String(nodeodm.task_queue_count)} />
              </dl>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        ● Aktif
      </span>
    );
  }
  return (
    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
      ● Tidak Aktif
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 py-1.5">
      <dt className="text-slate-600">{label}</dt>
      <dd className={mono ? "font-mono text-slate-900" : "font-medium text-slate-900"}>
        {value}
      </dd>
    </div>
  );
}
