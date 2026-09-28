"use client";

import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Loader2, MapPin, RefreshCw, Truck } from "lucide-react";

type ScanEvent = { date: string | null; status: string | null; activity: string | null; location: string | null };

type PushResult = { success: boolean; data?: { shiprocketOrderId: string | null; shiprocketShipmentId: string | null }; error?: string };
type SyncResult = {
  success: boolean;
  data?: { shiprocketStatus: string | null; awbCode: string | null; courierName: string | null; currentLocation: string | null; scans: ScanEvent[] };
  error?: string;
};

type PushAction = (formData: FormData) => Promise<PushResult>;
type SyncAction = (orderId: string) => Promise<SyncResult>;

const DIMENSION_FIELDS = [
  { name: "weight", label: "Weight (kg)" },
  { name: "length", label: "Length (cm)" },
  { name: "breadth", label: "Breadth (cm)" },
  { name: "height", label: "Height (cm)" },
] as const;

export function ShiprocketCard({
  id,
  action,
  syncAction,
  initialShiprocketOrderId,
  initialAwbCode,
  initialCourierName,
  initialShiprocketStatus,
}: {
  id: string;
  action: PushAction;
  syncAction: SyncAction;
  initialShiprocketOrderId: string | null;
  initialAwbCode: string | null;
  initialCourierName: string | null;
  initialShiprocketStatus: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [isSyncing, startSyncTransition] = useTransition();
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [shiprocketOrderId, setShiprocketOrderId] = useState(initialShiprocketOrderId);
  const [awbCode, setAwbCode] = useState(initialAwbCode);
  const [courierName, setCourierName] = useState(initialCourierName);
  const [status, setStatus] = useState(initialShiprocketStatus);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [scans, setScans] = useState<ScanEvent[]>([]);

  const handleShip = () => {
    if (!confirm("Create this order in Shiprocket? Only do this once per order.")) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", id);
      for (const field of DIMENSION_FIELDS) {
        const value = dimensions[field.name]?.trim();
        if (value) formData.set(field.name, value);
      }
      const result = await action(formData);
      if (!result.success) {
        setError(result.error || "Could not push to Shiprocket. Reload and check before retrying.");
        return;
      }
      if (result.data?.shiprocketOrderId) setShiprocketOrderId(result.data.shiprocketOrderId);
      setStatus("NEW");
    });
  };

  const handleSync = (silent = false) => {
    if (!silent) setError(null);
    startSyncTransition(async () => {
      const result = await syncAction(id);
      if (!result.success) {
        if (!silent) setError(result.error || "Failed to sync status from Shiprocket.");
        return;
      }
      if (result.data?.shiprocketStatus) setStatus(result.data.shiprocketStatus);
      if (result.data?.awbCode) setAwbCode(result.data.awbCode);
      if (result.data?.courierName) setCourierName(result.data.courierName);
      setCurrentLocation(result.data?.currentLocation || null);
      setScans(result.data?.scans || []);
    });
  };

  // Auto-sync once on open so the panel reflects Shiprocket's live status without a manual click.
  useEffect(() => {
    if (initialShiprocketOrderId || initialAwbCode) handleSync(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!shiprocketOrderId) {
    return (
      <div className="space-y-4">
        {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          {DIMENSION_FIELDS.map((field) => (
            <label key={field.name} className="space-y-1">
              <span className="block text-xs font-semibold text-stone-600">{field.label}</span>
              <input
                type="number"
                name={field.name}
                value={dimensions[field.name] ?? ""}
                onChange={(event) => setDimensions((current) => ({ ...current, [field.name]: event.target.value }))}
                placeholder="Auto"
                inputMode="decimal"
                min="0"
                step="0.1"
                className="min-h-10 w-full rounded-lg border border-stone-300 bg-white px-3 text-sm"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          Actual packed parcel dimensions give more accurate courier rates — leave any field blank to auto-estimate it.
        </p>
        <button
          type="button"
          onClick={handleShip}
          disabled={isPending}
          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          {isPending ? "Shipping…" : "Ship via Shiprocket"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm">
      {error && <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-700">{error}</div>}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Order sent to Shiprocket</span>
        </div>
        <button
          type="button"
          onClick={() => handleSync()}
          disabled={isSyncing}
          title="Fetch the latest status directly from Shiprocket"
          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-[#9c5247]/10 hover:text-[#9c5247] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="flex justify-between text-stone-600">
        <span>Shiprocket Order ID</span>
        <span className="font-mono text-stone-900">{shiprocketOrderId}</span>
      </div>

      {awbCode ? (
        <>
          <div className="flex justify-between text-stone-600">
            <span>AWB Code</span>
            <span className="font-mono text-stone-900">{awbCode}</span>
          </div>
          {courierName && (
            <div className="flex justify-between text-stone-600">
              <span>Courier</span>
              <span className="font-medium text-stone-900">{courierName}</span>
            </div>
          )}
          {status && (
            <div className="flex items-center justify-between text-stone-600">
              <span>Live Status</span>
              <span className="rounded-full border border-[#9c5247]/20 bg-[#9c5247]/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#9c5247]">
                {status}
              </span>
            </div>
          )}
          {currentLocation && (
            <div className="flex items-center justify-between text-stone-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-stone-400" /> Current Location
              </span>
              <span className="font-medium text-stone-900">{currentLocation}</span>
            </div>
          )}
          <a
            href={`https://shiprocket.co/tracking/${awbCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#9c5247]/20 px-4 py-2.5 text-sm font-semibold text-stone-900 transition-colors hover:bg-[#9c5247]/5"
          >
            Track Shipment <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {scans.length > 0 && (
            <div className="pt-2">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Tracking Timeline</p>
              <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
                {scans.map((scan, idx) => (
                  <div key={idx} className="flex gap-2.5">
                    <div className="flex flex-col items-center pt-0.5">
                      <div className={`h-2 w-2 rounded-full ${idx === 0 ? "bg-[#9c5247]" : "bg-stone-300"}`} />
                      {idx !== scans.length - 1 && <div className="mt-1 w-px flex-1 bg-stone-200" />}
                    </div>
                    <div className="pb-2.5">
                      <p className="text-xs font-medium text-stone-900">{scan.activity || scan.status}</p>
                      {scan.location && <p className="text-[11px] text-stone-500">{scan.location}</p>}
                      {scan.date && (
                        <p className="mt-0.5 text-[10px] text-stone-400">
                          {new Date(scan.date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : !status || status.toUpperCase() === "NEW" ? (
        <p className="text-xs italic text-stone-500">
          No courier assigned yet — go to Shiprocket and click &quot;Ship Now&quot; on this order. The AWB and courier will appear here automatically once you do (via webhook, or click refresh above).
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between text-stone-600">
            <span>Live Status</span>
            <span className="rounded-full border border-[#9c5247]/20 bg-[#9c5247]/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-[#9c5247]">
              {status}
            </span>
          </div>
          <p className="text-xs italic text-stone-500">
            Shiprocket hasn&apos;t returned an AWB code for this order — the tracking link and courier name won&apos;t be available here, but the status above is still live from Shiprocket.
          </p>
        </>
      )}
    </div>
  );
}
