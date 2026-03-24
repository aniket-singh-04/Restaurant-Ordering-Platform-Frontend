import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { To } from "react-router-dom";
import { goBackOrNavigate } from "../../../../utils/navigation";

interface HeaderProps {
  title: string;
  className?: string;
  fallbackTo?: To;
}

export default function Header({ title, className, fallbackTo }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header
      className={`${className ? `${className} ` : ""}sticky top-0 z-40 bg-[#fff9f0] border-b border-[#f0e6d6] backdrop-blur-md`}
    >
      <div className="flex items-center h-16 px-4">
        <button
          onClick={() => {
            if (fallbackTo) {
              goBackOrNavigate(navigate, fallbackTo, location.key);
              return;
            }

            navigate(-1);
          }}
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
