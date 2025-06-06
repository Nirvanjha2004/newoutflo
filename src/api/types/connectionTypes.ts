import { GenericApiResponse } from "../../common/api";
import { Connection } from "../../types/connections";

export type GetConnectionsResponse = GenericApiResponse<{
  connectionsCount: number;
  connections: Connection[];
  cursors: {
    previous: string | null;
    next: string | null;
  };
}>;
