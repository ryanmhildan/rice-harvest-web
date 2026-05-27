/**
 * components/system-status.tsx
 * ================================================================
 * Indicator status backend + NodeODM, polling tiap 10 detik.
 *
 * KONSEP REACT YANG DIPAKAI:
 *   - useState: simpan data yang berubah (status backend, NodeODM)
 *   - useEffect: jalankan side-effect (fetch + setInterval) setelah
 *     komponen di-mount. Cleanup function (return) jalan saat unmount
 *     untuk hindari memory leak.
 *
 * KENAPA TIDAK PAKAI react-query / swr?
 * Cukup pakai useEffect untuk skripsi. Library tambahan = kompleksitas
 * tambahan yang harus Anda jelaskan saat sidang.
 * ================================================================
 */
"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Server, AlertCircle } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "loading" | "ok" | "down";

interface StatusInfo {
  backend: Status;
  nodeodm: Status;
  nodeodmVersion?: string;
  errorMsg?: string;
}

export function SystemStatus() {
  const [status, setStatus] = useState<StatusInfo>({
    backend: "loading",
    nodeodm: "loading",
  });

  // Fungsi cek status — dipanggil saat mount & tiap interval
  async function checkStatus() {
    // Cek backend dulu
    try {
      await api.getHealth();
    } catch {
      setStatus({
        backend: "down",
        nodeodm: "down",
        errorMsg: "Backend FastAPI tidak responsif",
      });
      return;
    }

    // Backend OK, lanjut cek NodeODM
    try {
      const odm = await api.getNodeODMStatus();
      setStatus({
        backend: "ok",
        nodeodm: "ok",
        nodeodmVersion: odm.version,
      });
    } catch (err) {
      const msg = err instanceof ApiClientError
        ? err.detail
        : "NodeODM tidak responsif";
      setStatus({
        backend: "ok",
        nodeodm: "down",
        errorMsg: msg,
      });
    }
  }

  useEffect(() => {
    // Cek pertama kali
    checkStatus();

    // Polling tiap 10 detik
    const interval = setInterval(checkStatus, 10_000);

    // Cleanup: stop polling saat komponen unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Status Sistem
      </h3>
      <div className="space-y-1.5">
        <StatusRow
          label="Backend FastAPI"
          icon={status.backend === "ok" ? Wifi : WifiOff}
          status={status.backend}
          info={status.backend === "ok" ? "Port 8000" : "Tidak terhubung"}
        />
        <StatusRow
          label="NodeODM"
          icon={status.nodeodm === "ok" ? Server : AlertCircle}
          status={status.nodeodm}
          info={
            status.nodeodm === "ok"
              ? `v${status.nodeodmVersion}`
              : status.errorMsg ?? "Tidak terhubung"
          }
        />
      </div>
    </div>
  );
}

function StatusRow({
  label,
  icon: Icon,
  status,
  info,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: Status;
  info: string;
}) {
  const colorClass =
    status === "ok"
      ? "text-green-700"
      : status === "down"
        ? "text-red-600"
        : "text-slate-400";

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={cn("h-4 w-4 flex-shrink-0", colorClass)} />
      <span className="font-medium text-slate-700">{label}</span>
      <span className={cn("text-xs", colorClass)}>—</span>
      <span className="text-xs text-slate-500">{info}</span>
    </div>
  );
}
