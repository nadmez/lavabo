import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminFetch, invalidateStorefrontCatalog } from "@/admin/api";

export function useAdminCatalog() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: () => adminFetch("/api/admin/catalog"),
  });

  return {
    ...query,
    invalidate: () => invalidateStorefrontCatalog(queryClient),
  };
}
