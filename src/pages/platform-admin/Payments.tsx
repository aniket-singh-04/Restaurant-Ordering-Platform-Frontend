import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
  getPlatformAdminPayment,
  refundPlatformAdminPayment,
  usePlatformAdminPayments,
} from "../../features/platform-admin/payments/api";
import type { AdminPaymentRecord } from "../../features/platform-admin/auth/types";
import { formatPrice } from "../../utils/formatPrice";
import { FilterListBox } from "../../components/FilterListBox";
import {
  paymentStatusOptions,
  refundStatusOptions,
  providerOptions,
} from "../../utils/filterOptions";

const cardClass = "ui-card";

export default function PlatformAdminPayments() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [refundStatus, setRefundStatus] = useState("");
  const [provider, setProvider] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | undefined>();

  const query = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search,
      status,
      refundStatus,
      provider,
    }),
    [search, status, refundStatus, provider],
  );

  const payments = usePlatformAdminPayments(query);
  const paymentDetail = useQuery({
    queryKey: ["platform-admin", "payment-detail", selectedPaymentId],
    enabled: Boolean(selectedPaymentId),
    queryFn: async () => getPlatformAdminPayment(selectedPaymentId as string),
  });

  useEffect(() => {
    if (!selectedPaymentId && payments.data?.items[0]?.id) {
      setSelectedPaymentId(payments.data.items[0].id);
    }
  }, [payments.data, selectedPaymentId]);

  const refundMutation = useMutation({
    mutationFn: (payload: { paymentAttemptId: string; reason: string }) =>
      refundPlatformAdminPayment(payload.paymentAttemptId, payload.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "payments"] });
      void queryClient.invalidateQueries({ queryKey: ["platform-admin", "payment-detail"] });
    },
  });

  const handleRefund = async (payment: AdminPaymentRecord) => {
    const reason = window.prompt(`Refund ${payment.id}\nReason:`, "");
    if (!reason?.trim()) return;

    try {
      await refundMutation.mutateAsync({
        paymentAttemptId: payment.id,
        reason: reason.trim(),
      });
      pushToast({
        title: "Refund initiated",
        variant: "success",
      });
    } catch (error) {
      pushToast({
        title: "Refund failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "error",
      });
    }
  };

  return (
    <div className="grid gap-3 xl:grid-cols-[1.5fr_0.5fr] overflow-x-hidden">
      <section className="space-y-6 min-w-0 pt-4">
        {/* Filters Card */}
        <div className={`${cardClass} relative z-20`}>
          <p className="text-xs uppercase tracking-[0.35em] text-[#8b7661]">Payments</p>
          <h1 className="mt-3 font-serif text-3xl font-bold">Payment monitoring and refunds</h1>
          <div className="mt-6 space-y-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search provider or IDs..."
              className="w-full rounded-2xl border border-[#e0d2c3] px-4 py-3 text-sm placeholder-[#a89c8f] transition-all hover:border-[#d7c8b7] focus:border-[#9d8c7a] focus:outline-none focus:ring-2 focus:ring-[#8f5f2f] focus:ring-opacity-20"
            />
            <div className="grid gap-4 md:grid-cols-3">
              <FilterListBox label="Payment Status" options={paymentStatusOptions} value={status} onChange={setStatus} placeholder="Filter by payment status" />
              <FilterListBox label="Refund Status" options={refundStatusOptions} value={refundStatus} onChange={setRefundStatus} placeholder="Filter by refund status" />
              <FilterListBox label="Provider" options={providerOptions} value={provider} onChange={setProvider} placeholder="Filter by provider" />
            </div>
          </div>
        </div>

        {/* Payments Table Card */}
        <div className={cardClass}>
          {payments.isLoading ? (
            <div className="space-y-4">
              <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
              <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
              <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
            </div>
          ) : payments.isError || !payments.data ? (
            <div className="rounded-2xl bg-[#fef3f0] p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-[#d84040]" />
                <div>
                  <h3 className="font-semibold text-[#d84040]">Failed to load payments</h3>
                  <p className="mt-1 text-sm text-[#b84040]">
                    {payments.error instanceof Error ? payments.error.message : "Please try again."}
                  </p>
                </div>
              </div>
            </div>
          ) : payments.data.items.length ? (
            <div className="overflow-x-auto rounded-2xl border border-[#f0e6dc] shadow-sm">
              <table className="min-w-full text-left text-sm divide-y divide-[#f0e6dc]">
                <thead className="bg-[#faf6f0]">
                  <tr>
                    <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Payment</th>
                    <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Provider</th>
                    <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Status</th>
                    <th className="py-3 px-4 font-semibold text-[#8b7661] text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {payments.data.items.map((payment) => (
                    <tr
                      key={payment.id}
                      className={`border-t border-[#f4efe7] transition-colors duration-150 ${selectedPaymentId === payment.id ? "bg-[#fef8f0]" : "hover:bg-[#f9f5ee]"
                        } cursor-pointer`}
                      onClick={() => setSelectedPaymentId(payment.id)}
                    >
                      <td className="py-4 px-4">
                        <p className="font-semibold text-[#2a221c]">{payment.id.slice(0, 8)}</p>
                        <p className="text-sm text-[#8f5f2f] font-medium">{formatPrice(payment.amount / 100)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-block rounded-full bg-[#f4efe7] px-3 py-1 text-xs font-medium text-[#8b7661]">
                          {payment.provider}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-[#2a221c]">{payment.status}</p>
                        <p className="text-xs text-[#a89c8f] mt-1">Refund: {payment.refunds[0]?.status ?? "None"}</p>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleRefund(payment);
                          }}
                          disabled={refundMutation.isPending}
                          className="rounded-full border border-[#d7c8b7] px-4 py-2 text-xs font-semibold text-[#2a221c] transition-all hover:bg-[#f4efe7] disabled:opacity-50"
                        >
                          Manual refund
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#f4efe7] p-4 text-center">
              <p className="text-[#a89c8f]">No payments matched the current filters.</p>
            </div>
          )}
        </div>
      </section>

      {/* Selected Payment Details */}
      <aside className={`${cardClass} min-w-0`}>
        <h2 className="font-serif text-2xl font-semibold text-[#2a221c]">Selected Payment</h2>
        {paymentDetail.isLoading ? (
          <div className="mt-4 space-y-4">
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
            <div className="h-12 animate-pulse rounded-2xl bg-[#f4efe7]" />
          </div>
        ) : paymentDetail.isError || !paymentDetail.data ? (
          <div className="mt-4 rounded-2xl bg-[#f4efe7] p-4">
            <p className="text-sm text-[#a89c8f]">Select a payment attempt to inspect its refund history.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-5 text-sm">
            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Payment ID</p>
              <p className="mt-2 font-mono text-[#2a221c]">{paymentDetail.data.id}</p>
            </div>
            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Amount</p>
              <p className="mt-2 font-serif text-2xl font-bold text-[#8f5f2f]">{formatPrice(paymentDetail.data.amount / 100)}</p>
            </div>
            <div className="border-b border-[#efe6da] pb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Provider Payment ID</p>
              <p className="mt-2 font-mono text-[#2a221c]">{paymentDetail.data.providerPaymentId || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8b7661]">Refund Records</p>
              {paymentDetail.data.refunds.length ? (
                <ul className="mt-3 space-y-2">
                  {paymentDetail.data.refunds.map((refund) => (
                    <li key={refund.id} className="rounded-2xl border border-[#efe6da] bg-[#faf8f5] px-4 py-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#f4efe7] px-2 py-1 font-medium text-[#8b7661]">{refund.status}</span>
                        <span className="font-semibold text-[#2a221c]">{formatPrice(refund.amount / 100)}</span>
                      </div>
                      <p className="mt-2 text-[#a89c8f]">{refund.reason}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[#a89c8f]">No refunds created yet.</p>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
