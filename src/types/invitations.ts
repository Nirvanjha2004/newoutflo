import { User } from "./inbox";

export type Invitation = {
  id: number;
  text: string;
  accountId: number;
  user: User;
  createdAt: string;
};
