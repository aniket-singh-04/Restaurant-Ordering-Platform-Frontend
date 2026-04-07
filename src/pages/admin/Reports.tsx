import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  downloadOwnerReport,
  generateOwnerReport,
  useOwnerReports,
  type ReportArtifactRecord,
  type ReportPeriodType,
} from "../../features/reports/api";

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

const ReportRow = ({
  report,
  onDownload,
  downloadingId,
}: {
  report: ReportArtifactRecord;
  onDownload: (reportId: string) => Promise<void>;
  downloadingId: string | null;
}) => (
  <article className="rounded-2xl border border-[#eedbc8] bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8d7967]">
          {report.periodType}
        </p>
        <h3 className="mt-2 text-xl font-bold text-[#3b2f2f]">
          {new Date(report.periodStart).toLocaleDateString()} to{" "}
          {new Date(report.periodEnd).toLocaleDateString()}
        </h3>
        <p className="mt-2 text-sm text-[#6b665f]">
          Generated:{" "}
          {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : "Not ready yet"}
        </p>
        {report.expiresAt ? (
          <p className="mt-1 text-xs text-[#8d7967]">
            Expires: {new Date(report.expiresAt).toLocaleString()}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-3 sm:items-end">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusToneClass[report.status] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {report.status}
        </span>
        <button
          type="button"
          disabled={report.status !== "READY" || downloadingId === report.id}
          onClick={() => {
            void onDownload(report.id);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-[#d8c0a7] px-4 py-2.5 text-sm font-semibold text-[#5d4d3f] transition hover:bg-[#fffaf5] disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {downloadingId === report.id ? "Preparing..." : "Download Excel"}
        </button>
      </div>
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-4">
      <div className="rounded-xl border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Orders</p>
        <p className="mt-2 text-lg font-bold text-[#3b2f2f]">
          {report.metrics?.totalOrders ?? 0}
        </p>
      </div>
      <div className="rounded-xl border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Gross</p>
        <p className="mt-2 text-lg font-bold text-[#3b2f2f]">
          {formatMinorAmount(report.metrics?.grossRevenueMinor)}
        </p>
      </div>
      <div className="rounded-xl border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Refunds</p>
        <p className="mt-2 text-lg font-bold text-[#3b2f2f]">
          {formatMinorAmount(report.metrics?.refundTotalMinor)}
        </p>
      </div>
      <div className="rounded-xl border border-[#f0e3d5] bg-[#fffaf5] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8d7967]">Net</p>
        <p className="mt-2 text-lg font-bold text-[#3b2f2f]">
          {formatMinorAmount(report.metrics?.totalRevenueMinor)}
        </p>
      </div>
    </div>

    {report.generationError ? (
      <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {report.generationError}
      </p>
    ) : null}
  </article>
);

export default function Reports() {
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [periodType, setPeriodType] = useState<ReportPeriodType | "">("");
  const [generatePeriodType, setGeneratePeriodType] = useState<ReportPeriodType>("DAILY");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const reportsQuery = useOwnerReports(periodType || undefined);
  const reports = useMemo(() => reportsQuery.data ?? [], [reportsQuery.data]);

  const generateMutation = useMutation({
    mutationFn: generateOwnerReport,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync(generatePeriodType);
      pushToast({
        title: "Report queued",
        description: `${generatePeriodType} report generation has been queued.`,
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
      const result = await downloadOwnerReport(reportId);
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
      <section className="rounded-2xl border border-[#eedbc8] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8b7661]">
              Reports
            </p>
            <h1 className="mt-3 text-3xl font-bold text-[#3b2f2f]">
              Revenue and order exports
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#6b665f]">
              Queue daily, weekly, monthly, or yearly Excel reports and download ready files from
              secure storage.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void reportsQuery.refetch()}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d8c0a7] px-4 py-3 text-sm font-semibold text-[#5d4d3f] transition hover:bg-[#fffaf5]"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#eedbc8] bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-[#6d5c4d]">
              Filter period
              <select
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value as ReportPeriodType | "")}
                className="mt-2 w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3"
              >
                <option value="">All periods</option>
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[#6d5c4d]">
              Generate new report
              <select
                value={generatePeriodType}
                onChange={(event) => setGeneratePeriodType(event.target.value as ReportPeriodType)}
                className="mt-2 w-full rounded-xl border border-[#e5d5c6] bg-[#fff9f2] px-4 py-3"
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={generateMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2f241d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#46362b] disabled:opacity-60"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {generateMutation.isPending ? "Queueing..." : "Generate Report"}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        {reportsQuery.isLoading ? (
          <div className="rounded-2xl border border-[#eedbc8] bg-white p-6 shadow-sm text-[#6d5c4d]">
            Loading reports...
          </div>
        ) : reports.length ? (
          reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onDownload={handleDownload}
              downloadingId={downloadingId}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d9c1a8] bg-white px-6 py-12 text-center text-[#6d5c4d]">
            No reports matched the selected filters yet.
          </div>
        )}
      </section>
    </div>
  );
}
