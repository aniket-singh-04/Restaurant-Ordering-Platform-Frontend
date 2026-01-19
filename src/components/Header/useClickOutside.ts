import { useEffect } from "react";

export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  handler: () => void
) {
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(event.target as Node)) return; //Checks if one element is inside another (event.target is clicked element)
      handler();
    };

    document.addEventListener("mousedown", listener); // Listen to every mouse press anywhere on the page, and when it happens, run listener.
    return () => document.removeEventListener("mousedown", listener); // When this component is removed, stop listening for mouse clicks.
  }, [ref, handler]); // We include ref in the dependency array for safety and linting, even though refs usually don’t change.
}
