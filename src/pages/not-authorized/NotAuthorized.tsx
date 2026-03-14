import { useNavigate } from "react-router-dom";

export default function NotAuthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff9f0] text-center px-6">
      <h1 className="text-5xl font-extrabold mb-4 text-[#3b2f2f]">
        Access Denied
      </h1>
      <p className="text-base text-gray-600 mb-6">
        You do not have permission to view this page.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl border border-orange-500 text-orange-500 font-semibold hover:bg-orange-50"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:opacity-90"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

