import { ApiErrorResponse, ApiResponse } from "apisauce";
import humps from "humps";

import { ApiError, ErrorResponse } from "../../common/api/error";
import { authStore } from "../../api/store/authStore";

export const checkUnauthorized = <T>(response: ApiResponse<T, ErrorResponse>, shouldCamelize = true) => {
  if (response.ok) {
    if (shouldCamelize) {
      return humps.camelizeKeys(response.data as any) as unknown as T;
    }
    return response.data as T;
  }
  if (response.status === 401) {
    authStore.setState({ isAuthenticated: false, user: null, accessToken: null });
  }
  throw new ApiError(response as ApiErrorResponse<ErrorResponse>);
};
