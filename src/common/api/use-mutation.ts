import {
  MutationFunction,
  MutationKey,
  useMutation as libUseMutation,
  UseMutationOptions,
} from "@tanstack/react-query";

import { ErrorResponse } from "../../common/api/error";

export const useMutation = <T, K>({
  mutationKey,
  mutationFn,
  options,
}: {
  mutationKey: MutationKey;
  mutationFn: MutationFunction<T, K>;
  options?: Omit<UseMutationOptions<T, ErrorResponse, K>, "mutationKey" | "mutationFn">;
}) => {
  return libUseMutation<T, ErrorResponse, K>({
    mutationKey,
    mutationFn,
    ...options
  });
};
