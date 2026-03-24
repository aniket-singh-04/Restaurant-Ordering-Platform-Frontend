import type { NavigateFunction, To } from "react-router-dom";

export const goBackOrNavigate = (
  navigate: NavigateFunction,
  fallbackTo: To,
  locationKey?: string,
) => {
  if (locationKey && locationKey !== "default") {
    navigate(-1);
    return;
  }

  navigate(fallbackTo, { replace: true });
};
