import { create } from "apisauce";
import { AxiosRequestConfig } from "axios";

import { BASE_URL } from "../../common/api/constants";
import { ErrorResponse } from "../../common/api/error";
import { authStore } from "../../api/store/authStore";

export const api = create({
  baseURL: BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json; charset=utf-8",
    //"authorization": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdJZCI6ImFmNzA3YWFmLTc4OTMtNDdiZi1hZjE5LTk1Zjk4OTE2OWM5MSIsInVzZXJJZCI6IjBkZDIwNWM3LTdmNzYtNDFhZC05ZjQ4LTVhMTYxZDVhYzMxZCIsImlhdCI6MTc0NTkxODg1MSwiZXhwIjoxNzQ2MDA1MjUxfQ.6Q2EJ0PlP8N-m61kLBNvqrjA5jbkfOgmZGQuvQpfK9w",
  },
});

export const authConfig = <K extends {} = {}>(additionalHeaders?: K): AxiosRequestConfig => {
  const isAuthenticated = authStore.getState().isAuthenticated;
  const accessToken = authStore.getState().accessToken;

  if (isAuthenticated) {
    return {
      headers: {
        authorization: `${accessToken}`,
        ...(additionalHeaders ? additionalHeaders : {}),
      },
    };
  }
  return {
    headers: {
      ...(additionalHeaders ? additionalHeaders : {}),
    },
  };
};

export const get = async <T, P extends {} = {}, K extends {} = {}>(url: string, params?: P, additionalHeaders?: K) =>
  await api.get<T, ErrorResponse>(url, params ?? {}, authConfig<K>(additionalHeaders));
export const post = async <T, D extends any = {}, K extends {} = {}>(url: string, data?: D, additionalHeaders?: K) =>
  await api.post<T, ErrorResponse>(url, data, authConfig<K>(additionalHeaders));
export const put = async <T, D extends any = {}, K extends {} = {}>(url: string, data?: D, additionalHeaders?: K) =>
  await api.put<T, ErrorResponse>(url, data, authConfig<K>(additionalHeaders));
export const del = async <T, P extends {} = {}, K extends {} = {}>(url: string, params?: P, additionalHeaders?: K) =>
  await api.delete<T, ErrorResponse>(url, params ?? {}, authConfig<K>(additionalHeaders));
