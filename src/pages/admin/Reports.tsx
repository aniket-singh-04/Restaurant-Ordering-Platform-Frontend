import { useMemo, useState, Fragment } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, RefreshCw, ChevronDownIcon, CheckIcon } from "lucide-react";
import { Listbox, Transition, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { useToast } from "../../context/ToastContext";
import {
  downloadOwnerReport,
  generateOwnerReport,
  useOwnerReports,
  type ReportArtifactRecord,
  type ReportPeriodType,
} from "../../features/reports/api";

type PeriodSelectOption = {
  value: ReportPeriodType | "";
  label: string;
};

const PERIOD_OPTIONS: PeriodSelectOption[] = [
  {
    value: "DAILY",
    label: "Daily",
  },
  {
    value: "WEEKLY",
    label: "Weekly",
  },
  {
    value: "MONTHLY",
    label: "Monthly",
  },
  {
    value: "YEARLY",
    label: "Yearly",
  },
];

const FILTER_OPTIONS: PeriodSelectOption[] = [
  {
    value: "",
    label: "All periods",
  },
  ...PERIOD_OPTIONS,
];

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

const PeriodListboxField = ({
  label,
  helper,
  value,
  options,
  onChange,
}: {
  label: string;
  helper: string;
  value: ReportPeriodType | "";
  options: PeriodSelectOption[];
  onChange: (value: ReportPeriodType | "") => void;
}) => {
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className="rounded-xl border border-[#ead8c5] bg-[#fffaf4] p-4">
      <div className="mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7661]">
          {label}
        </p>
        <p className="mt-1 text-sm text-[#6b665f]">{helper}</p>
      </div>

      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#dcc6b1] bg-white px-4 py-3 text-left text-sm font-medium text-[#3b2f2f] transition hover:border-[#caad8d] focus:outline-none focus:ring-2 focus:ring-[#f3a264]/40">
            <span className="truncate">{selectedOption.label}</span>
            <ChevronDownIcon className="h-4 w-4 shrink-0 text-[#6f5947]" />
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 -translate-y-1"
          >
            <ListboxOptions className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-[#e5d5c6] bg-white shadow-lg focus:outline-none">
              {options.map((option) => (
                <ListboxOption
                  key={option.value || "all"}
                  value={option.value}
                  className={({ active }) =>
                    `cursor-pointer select-none px-4 py-2 flex items-center justify-between ${active ? "bg-orange-100 text-orange-700" : "text-gray-700"
                    }`
                  }
                >
                  {({ selected }) => (
                    <>
                      <span>{option.label}</span>
                      {selected && <CheckIcon className="h-4 w-4 text-orange-500" />}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
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
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusToneClass[report.status] ?? "bg-slate-100 text-slate-700"
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
  const selectedGenerateOption =
    PERIOD_OPTIONS.find((option) => option.value === generatePeriodType) ??
    PERIOD_OPTIONS[0];

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
              className="w-fit cursor-pointer inline-flex items-center gap-2 rounded-lg border border-[#ef6820] px-4 py-2.5 text-sm font-medium text-[#ef6820] transition hover:bg-white"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#eedbc8] bg-white p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-4 md:grid-cols-2">
            <PeriodListboxField
              label="Filter period"
              helper="Choose which reports to show."
              value={periodType}
              options={FILTER_OPTIONS}
              onChange={(value) => setPeriodType(value as ReportPeriodType | "")}
            />

            <PeriodListboxField
              label="Generate report"
              helper="Choose which report to generate."
              value={generatePeriodType}
              options={PERIOD_OPTIONS}
              onChange={(value) => setGeneratePeriodType(value as ReportPeriodType)}
            />
          </div>

          <div className="rounded-xl border border-[#ead8c5]  p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b7661]">
              Generate
            </p>
            <p className="mt-2 text-sm text-[#6b665f]">
              Queue a new <span className="font-semibold text-[#3b2f2f]">{selectedGenerateOption.label}</span> report.
            </p>

            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generateMutation.isPending}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f241d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#46362b] disabled:opacity-60"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {generateMutation.isPending ? "Queueing..." : "Generate Report"}
            </button>
          </div>
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
