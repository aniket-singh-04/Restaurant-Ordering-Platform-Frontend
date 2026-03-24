import { useEffect, useMemo } from "react";
import { useQrContext } from "./api";
import { useQrContextStore } from "./store";

export const useActiveQrContext = (publicQrId?: string) => {
  const query = useQrContext(publicQrId);
  const context = useQrContextStore((state) => state.context);
  const setContext = useQrContextStore((state) => state.setContext);

  useEffect(() => {
    if (query.data) {
      setContext(query.data);
    }
  }, [query.data, setContext]);

  const activeContext = useMemo(() => {
    if (query.data) {
      return query.data;
    }

    if (!publicQrId || !context) {
      return null;
    }

    return context.publicQrId === publicQrId ? context : null;
  }, [context, publicQrId, query.data]);

  return {
    ...query,
    data: activeContext,
  };
};
