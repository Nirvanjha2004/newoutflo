import { QueryFunction, QueryKey, useQuery as libUseQuery, UseQueryOptions } from "@tanstack/react-query";

import { ErrorResponse } from "../../common/api/error";

export const useQuery = <T>({
  queryKey,
  queryFn,
  options,
}: {
  queryKey: QueryKey;
  queryFn: QueryFunction<T>;
  options: Omit<UseQueryOptions<T, ErrorResponse, T>, "queryKey" | "queryFn">;
}) => {
  return libUseQuery<T, ErrorResponse>({ queryKey: queryKey, queryFn: queryFn, ...options });
};
