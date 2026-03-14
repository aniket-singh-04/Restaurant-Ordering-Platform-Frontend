import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  className?: string; // allow custom classes
}

export default function Header({ title, className }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className={`${className ? `${className} ` : ""}sticky top-0 z-40 bg-[#fff9f0] border-b border-[#f0e6d6] backdrop-blur-md`}
    >
      <div className="flex items-center h-16 px-4">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer flex items-center justify-center h-9 w-9 rounded-full border border-[#f97415] text-[#f97415] hover:bg-[#f97415]/10 transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="ml-3 font-serif text-lg font-semibold text-[#4a3f35] line-clamp-1">
          {title}
        </h1>
      </div>
    </header>

  );
}
