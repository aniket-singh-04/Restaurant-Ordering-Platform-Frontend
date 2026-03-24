import { useParams, useSearchParams } from "react-router-dom";

const encodePathSegment = (value: string) => encodeURIComponent(value);

export const buildQrHomePath = (publicQrId?: string) =>
  publicQrId ? `/qr/${encodePathSegment(publicQrId)}` : "/";

export const buildQrMenuPath = (publicQrId?: string) =>
  publicQrId ? `/qr/${encodePathSegment(publicQrId)}/menu` : "/menu";

export const buildQrMenuItemPath = (menuItemId: string, publicQrId?: string) =>
  publicQrId
    ? `/qr/${encodePathSegment(publicQrId)}/menu/${encodePathSegment(menuItemId)}`
    : `/menu/${encodePathSegment(menuItemId)}`;

export const buildQrCartPath = (publicQrId?: string) =>
  publicQrId ? `/qr/${encodePathSegment(publicQrId)}/cart` : "/cart";

export const useResolvedQrId = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const routeQrId =
    typeof params.publicQrId === "string" && params.publicQrId.trim()
      ? params.publicQrId
      : undefined;
  const queryQrId = searchParams.get("qr") ?? undefined;

  return routeQrId ?? queryQrId;
};
