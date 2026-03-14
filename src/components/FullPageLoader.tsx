export default function FullPageLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-gray-600">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

