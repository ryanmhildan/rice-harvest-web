/**
 * app/results/page.tsx
 * ================================================================
 * Halaman riwayat semua hasil klasifikasi.
 * ================================================================
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api, ApiClientError } from "@/lib/api";
import type { ResultListItem } from "@/lib/types";
import { formatTimestamp, formatPct } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ResultsPage() {
  const [items, setItems] = useState<ResultListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listResults()
      .then((data) => setItems(data.results))
      .catch((err) => {
        const msg = err instanceof ApiClientError ? err.detail : "Gagal load data";
        setError(msg);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <History className="h-6 w-6 text-slate-700" />
          Riwayat Klasifikasi
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Semua hasil klasifikasi yang pernah diproses oleh sistem.
        </p>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-900">{error}</p>
          </CardContent>
        </Card>
      )}

      {!error && items === null && (
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Memuat...
        </div>
      )}

      {items && items.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-slate-500">
              Belum ada hasil klasifikasi.
            </p>
            <Link
              href="/upload"
              className="mt-2 inline-block text-sm font-medium text-green-700 underline"
            >
              Mulai klasifikasi pertama →
            </Link>
          </CardContent>
        </Card>
      )}

      {items && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {items.map((item) => (
            <ResultCard key={item.filename} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function ResultCard({ item }: { item: ResultListItem }) {
  const isReady = item.verdict === "SIAP PANEN";

  return (
    <Link href={`/results/${item.timestamp}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className={cn(
              "flex items-center gap-2 text-base",
              isReady ? "text-green-800" : "text-red-800"
            )}>
              {isReady ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              )}
              {item.verdict}
            </CardTitle>
          </div>
          <CardDescription className="font-mono text-xs">
            {formatTimestamp(item.timestamp)}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <dl className="space-y-1 text-sm">
            <Row label="% Piksel Kuning" value={formatPct(item.yellow_pct)} />
            <Row label="Threshold" value={formatPct(item.threshold * 100, 0)} />
          </dl>
        </CardContent>
      </Card>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-mono font-medium text-slate-900">{value}</dd>
    </div>
  );
}
