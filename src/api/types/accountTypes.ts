import { GenericApiResponse } from "../../common/api";
import { Account } from "../../types/accounts";

export type GetAccountsResponse = GenericApiResponse<Account[]>;
export type GetAccountResponse = GenericApiResponse<Account>;
