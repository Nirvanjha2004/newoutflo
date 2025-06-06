import { GenericApiResponse } from "../../common/api";
import { Invitation } from "../../types/invitations";

export type GetInvitationsResponse = GenericApiResponse<{
  invitationsCount: number;
  invitations: Invitation[];
  cursors: {
    prev: string | null;
    next: string | null;
  };
}>;
