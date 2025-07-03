import { Dispatch, SetStateAction } from "react";

import { useInfiniteQuery } from "../common/api";
import { useAuthStore } from "../api/store/authStore";
import { getConnections } from "../api/connections";

export const useConnectionsQuery = (
  search?: string,
  setSearchLoading?: Dispatch<SetStateAction<boolean>>,
  showPending?: boolean,
) => {
  const { isAuthenticated } = useAuthStore();

  return useInfiniteQuery({
    queryKey: ["connections", search, showPending],
    queryFn: async ({ pageParam: cursor }) => {
      return (await getConnections(search ?? "", cursor, showPending)).data;
    },
    options: {
      enabled: isAuthenticated,
      keepPreviousData: true,
      refetchInterval: 1000,
      getPreviousPageParam: (firstPage) => {
        return firstPage.cursors.previous === null ? undefined : firstPage.cursors.previous;
      },
      getNextPageParam: (lastPage) => {
        return lastPage.cursors.next === null ? undefined : lastPage.cursors.next;
      },
      onSuccess: () => {
        setSearchLoading?.(false);
      },
    },
  });
};
