import { mockConnections } from "src/mocks";
import { State } from "../types/connections";
// Uncomment when using real API
// import { get, checkUnauthorized } from "../common/api";
// import { GetConnectionsResponse } from "../api/types/connectionTypes";

export const getConnections = async (search: string, _cursor?: string, showPending?: boolean) => {
  // Mocking
  const filteredConnections = (() => {
    const connections = mockConnections.filter((connection) => connection.state !== State.DELETED);
    if (showPending) {
      return connections;
    }
    return connections.filter((connection) => connection.state !== State.INACTIVE);
  })().filter(
    (connection) =>
      connection.user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      connection.user.lastName.toLowerCase().includes(search.toLowerCase()),
  );
  return {
    message: "Success",
    data: {
      connectionsCount: filteredConnections.length,
      connections: filteredConnections,
      cursors: {
        previous: null,
        next: null,
      },
    },
  };

  // const params = {
  //   cursor,
  //   ...(search.length > 0 ? { search_str: search } : {}),
  //   ...(showPending ? { states: State.INACTIVE.toString() } : {}),
  // };
  // return await get<GetConnectionsResponse, typeof params>("/platforms/connections/", params).then(checkUnauthorized);
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Get query parameters
    const urlParams = url.searchParams;
    const search = urlParams.get('search_str') || '';
    const cursor = urlParams.get('cursor') || undefined;
    const showPending = urlParams.get('states') === State.INACTIVE.toString();
    
    // Currently only GET method is supported for connections
    if (method === 'GET') {
      // GET /api/connections - get all connections
      const connectionsData = await getConnections(search, cursor, showPending);
      return res.status(200).json(connectionsData.data);
    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Connections API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
