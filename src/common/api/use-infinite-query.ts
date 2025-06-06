import {
  QueryFunction,
  QueryKey,
  useInfiniteQuery as libUseInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";

import { ErrorResponse } from "../../common/api/error";

export const useInfiniteQuery = <T>({
  queryKey,
  queryFn,
  options,
}: {
  queryKey: QueryKey;
  queryFn: QueryFunction<T>;
  options: Omit<UseInfiniteQueryOptions<T, ErrorResponse, T>, "queryKey" | "queryFn">;
}): UseInfiniteQueryResult<T, ErrorResponse> => {
  return libUseInfiniteQuery<T, ErrorResponse>({ queryKey: queryKey, queryFn: queryFn, ...options });
};
