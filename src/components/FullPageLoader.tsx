export default function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center px-4 py-8">
      <div className="ui-card flex min-w-[18rem] max-w-sm flex-col items-center gap-4 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--accent-soft-strong)] border-t-[color:var(--accent)]" />
        <div className="space-y-1">
          <p className="ui-eyebrow">Please wait</p>
          <p className="text-sm font-semibold text-[color:var(--text-primary)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
