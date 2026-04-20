type OptionalClassName = string | false | null | undefined;

const joinClasses = (...classes: OptionalClassName[]) =>
  classes.filter(Boolean).join(" ");

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={joinClasses("ui-skeleton", className)} />;
}

export function LoadingPanel({
  className = "",
  lines = 3,
}: {
  className?: string;
  lines?: number;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("ui-empty-state px-4 py-5", className)}>
      <span className="sr-only">Loading content</span>
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className={joinClasses(
              "h-3.5",
              index === 0 ? "w-32" : index === lines - 1 ? "w-40" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function LoadingMetricCards({
  count = 4,
  className = "",
  cardClassName = "",
}: {
  count?: number;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      <span className="sr-only">Loading metrics</span>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={joinClasses("ui-card rounded-3xl space-y-4", cardClassName)}
        >
          <div className="flex items-start justify-between gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-xl" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="h-8 w-28 max-w-full" />
          <SkeletonBlock className="h-4 w-24 max-w-full" />
        </div>
      ))}
    </div>
  );
}

export function LoadingListRows({
  rows = 3,
  className = "",
  rowClassName = "",
}: {
  rows?: number;
  className?: string;
  rowClassName?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("space-y-3", className)}>
      <span className="sr-only">Loading list</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className={joinClasses(
            "rounded-3xl border border-(--border-subtle) bg-(--surface) p-4 shadow-sm",
            rowClassName,
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-32 max-w-full" />
              <SkeletonBlock className="h-3 w-48 max-w-full" />
            </div>
            <SkeletonBlock className="h-7 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingTableRows({
  rows = 4,
  columns = 4,
  className = "",
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("ui-table-shell p-4", className)}>
      <span className="sr-only">Loading table data</span>
      <div className="space-y-3">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, index) => (
            <SkeletonBlock key={index} className="h-4 rounded-full" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid gap-3 rounded-2xl border border-(--border-subtle) bg-(--surface-strong) px-3 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <SkeletonBlock key={columnIndex} className="h-4 rounded-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoadingCardGrid({
  count = 6,
  className = "",
  cardClassName = "",
}: {
  count?: number;
  className?: string;
  cardClassName?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      <span className="sr-only">Loading cards</span>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={joinClasses(
            "overflow-hidden rounded-xl border border-(--border-subtle) bg-(--surface-strong) shadow-sm",
            cardClassName,
          )}
        >
          <SkeletonBlock className="h-44 w-full rounded-none" />
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-32 max-w-full" />
                <SkeletonBlock className="h-3.5 w-full" />
                <SkeletonBlock className="h-3.5 w-4/5" />
              </div>
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <SkeletonBlock className="h-9 rounded-lg" />
              <SkeletonBlock className="h-9 rounded-lg" />
              <SkeletonBlock className="h-9 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingOrderCards({
  count = 2,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div role="status" aria-live="polite" className={joinClasses("grid gap-5", className)}>
      <span className="sr-only">Loading orders</span>
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="rounded-4xl border border-(--border-subtle) bg-(--surface) p-5 shadow-sm"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <SkeletonBlock className="h-5 w-32" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
                <SkeletonBlock className="h-7 w-20 rounded-full" />
              </div>
              <SkeletonBlock className="h-3.5 w-44 max-w-full" />
            </div>
            <div className="grid gap-2 sm:w-44">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-5/6" />
              <SkeletonBlock className="h-4 w-4/6" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((__, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-2xl border border-(--border-subtle) bg-(--surface-muted) px-4 py-3"
              >
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="mt-3 h-4 w-24" />
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {Array.from({ length: 2 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className="rounded-2xl border border-(--border-subtle) bg-(--surface-muted) px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonBlock className="h-4 w-36 max-w-full" />
                    <SkeletonBlock className="h-3.5 w-28 max-w-full" />
                  </div>
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
