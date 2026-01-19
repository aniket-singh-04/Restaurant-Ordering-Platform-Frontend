import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fff9f0] text-center">
      <h1 className="text-6xl font-extrabold mb-4">404</h1>
      <p className="text-lg text-gray-600 mb-6">
        Page not found
      </p>

      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 cursor-pointer rounded-xl bg-orange-500 text-white font-semibold hover:opacity-90"
      >
        Go Home
      </button>
    </div>
  );
}
