import { QueryClientContext } from "@tanstack/react-query";
import { useContext, useEffect, useState } from "react";
import { catalogQueryOptions } from "@/hooks/use-products";

export function useCachedCatalog() {
  const queryClient = useContext(QueryClientContext);
  const [catalog, setCatalog] = useState(
    () => queryClient?.getQueryData?.(["catalog"]) ?? null
  );

  useEffect(() => {
    if (!queryClient) return undefined;

    const publish = () => {
      setCatalog(queryClient.getQueryData(["catalog"]) ?? null);
    };

    publish();
    if (!queryClient.getQueryData(["catalog"])) {
      queryClient.ensureQueryData(catalogQueryOptions()).catch(() => {});
    }

    return queryClient.getQueryCache().subscribe((event) => {
      if (event?.query?.queryKey?.[0] === "catalog") {
        publish();
      }
    });
  }, [queryClient]);

  return catalog;
}
