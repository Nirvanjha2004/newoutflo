import { GenericApiResponse } from "../../common/api";

export type PostAccessTokenRequest = {
  username: string;
  password: string;
  domain: string;
};

export type PostAccessTokenResponse = GenericApiResponse<string>;

export type PostSignupRequest = {
  name: string;
  domain: string;
  username: string;
  password: string;
};

export type PostSignupResponse = GenericApiResponse<string>;
