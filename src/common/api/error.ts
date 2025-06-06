import { ApiErrorResponse, PROBLEM_CODE } from "apisauce";

export type ErrorResponse = {
  message: string;
  reasons?: string[];
};

export type ApiErrorInfo = {
  problem: PROBLEM_CODE;
  status: number;
  data?: ErrorResponse;
};

export class ApiError extends Error {
  public errorInfo: ApiErrorInfo;
  constructor(response: ApiErrorResponse<ErrorResponse>) {
    const message = response?.data?.message ?? response.problem;
    super(message);
    this.errorInfo = {
      problem: response.problem,
      status: response.status ?? 500,
      data: response.data,
    };
  }
}
