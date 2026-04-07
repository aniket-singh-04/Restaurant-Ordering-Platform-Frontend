import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  downloadPlatformAdminReport,
  generatePlatformAdminReport,
  usePlatformAdminReports,
} from "../../features/platform-admin/reports/api";
import type { ReportArtifactRecord, ReportPeriodType } from "../../features/reports/api";

const PERIOD_OPTIONS: ReportPeriodType[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];

const formatMinorAmount = (value?: number) => `₹${((value ?? 0) / 100).toFixed(2)}`;

const openDownload = (url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
};

const statusToneClass: Record<string, string> = {
  READY: "bg-emerald-100 text-emerald-700",
  GENERATING: "bg-amber-100 text-amber-800",
  FAILED: "bg-red-100 text-red-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  PENDING: "bg-sky-100 text-sky-700",
};

const ReportTableRow = ({
  report,
  onDownload,
  downloadingId,
}: {
  report: ReportArtifactRecord;
  onDownload: (reportId: string) => Promise<void>;
  downloadingId: string | null;
}) => (
  <tr className="border-t border-[#f4efe7] align-top">
    <td className="px-4 py-4">
      <p className="font-semibold text-[#2a221c]">{report.restaurantId}</p>
      <p className="mt-1 text-xs text-[#8b7661]">{report.periodType}</p>
    </td>
    <td className="px-4 py-4 text-sm text-[#5f5146]">
      {new Date(report.periodStart).toLocaleDateString()} to{" "}
      {new Date(report.periodEnd).toLocaleDateString()}
    </td>
    <td className="px-4 py-4">
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold ${
          statusToneClass[report.status] ?? "bg-slate-100 text-slate-700"
        }`}
      >
        {report.status}
      </span>
    </td>
    <td className="px-4 py-4 text-sm text-[#5f5146]">
      {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Not ready"}
    </td>
    <td className="px-4 py-4 text-sm text-[#5f5146]">
      {formatMinorAmount(report.metrics?.totalRevenueMinor)}
    </td>
    <td className="px-4 py-4">
      <button
        type="button"
        disabled={report.status !== "READY" || downloadingId === report.id}
        onClick={() => {
          void onDownload(report.id);
        }}
        className="inline-flex items-center gap-2 rounded-full border border-[#d7c8b7] px-4 py-2 text-xs font-semibold text-[#2a221c] transition hover:bg-[#f4efe7] disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {downloadingId === report.id ? "Preparing..." : "Download"}
      </button>
    </td>
  </tr>
);

export default function PlatformAdminReports() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [restaurantId, setRestaurantId] = useState("");
  const [periodType, setPeriodType] = useState<ReportPeriodType | "">("");
  const [generateRestaurantId, setGenerateRestaurantId] = useState("");
  const [generatePeriodType, setGeneratePeriodType] = useState<ReportPeriodType>("DAILY");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reportsQuery = usePlatformAdminReports({
    restaurantId: restaurantId.trim() || undefined,
    periodType: periodType || undefined,
  });
  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);

  const generateMutation = useMutation({
    mutationFn: generatePlatformAdminReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform-admin", "reports"] });
    },
  });

  const handleGenerate = async () => {
    if (!generateRestaurantId.trim()) {
      pushToast({
        title: "Restaurant ID required",
        description: "Enter a restaurant ID before queueing a report.",
        variant: "warning",
      });
      return;
    }

    try {
      await generateMutation.mutateAsync({
        restaurantId: generateRestaurantId.trim(),
        periodType: generatePeriodType,
      });
      pushToast({
        title: "Report queued",
        description: `${generatePeriodType} report queued for ${generateRestaurantId.trim()}.`,
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Report could not be queued",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  const handleDownload = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const result = await downloadPlatformAdminReport(reportId);
      openDownload(result.downloadUrl);
    } catch (error) {
      pushToast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white shadow-sm">
        <p className="text-xs uppercase tracking-[0.35em] text-[#8b7661]">Reports</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">Platform report artifacts</h1>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_auto]">
          <input
            value={restaurantId}
            onChange={(event) => setRestaurantId(event.target.value)}
            placeholder="Filter by restaurant ID..."
            className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f]/20"
          />
          <select
            value={periodType}
            onChange={(event) => setPeriodType(event.target.value as ReportPeriodType | "")}
            className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8f5f2f]/20"
          >
            <option value="">All periods</option>
            {PERIOD_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            value={generateRestaurantId}
            onChange={(event) => setGenerateRestaurantId(event.target.value)}
            placeholder="Restaurant ID to generate..."
            className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f]/20"
          />
          <div className="flex gap-3">
            <select
              value={generatePeriodType}
              onChange={(event) => setGeneratePeriodType(event.target.value as ReportPeriodType)}
              className="rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#8f5f2f]/20"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2a221c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3d332b] disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {generateMutation.isPending ? "Queueing..." : "Generate"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white shadow-sm">
        {reportsQuery.isLoading ? (
          <div className="rounded-2xl bg-[#f4efe7] p-4 text-center text-[#8b7661]">
            Loading report artifacts...
          </div>
        ) : reports.length ? (
          <div className="overflow-x-auto rounded-2xl border border-[#f0e6dc] shadow-sm">
            <table className="min-w-full text-left text-sm divide-y divide-[#f0e6dc]">
              <thead className="bg-[#faf6f0]">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Restaurant</th>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Window</th>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Status</th>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Generated</th>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Net Revenue</th>
                  <th className="px-4 py-3 font-semibold text-[#8b7661]">Download</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {reports.map((report) => (
                  <ReportTableRow
                    key={report.id}
                    report={report}
                    onDownload={handleDownload}
                    downloadingId={downloadingId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#f4efe7] p-4 text-center">
            <p className="text-[#a89c8f]">No reports matched the current filters.</p>
          </div>
        )}
      </section>
    </div>
  );
}
