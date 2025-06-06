import { User } from "./inbox";

export enum State {
  ACTIVE,
  INACTIVE,
  DELETED,
}

export type Connection = {
  id: number;
  accountId: number;
  user: User;
  createdAt: string;
  state: State;
};
