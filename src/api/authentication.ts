import { checkUnauthorized, post } from "../common/api";
import { PostAccessTokenRequest, PostAccessTokenResponse } from "./types/authTypes";

export const postUserAccessTokens = async (domain: string, email: string, password: string) => {
  return await post<PostAccessTokenResponse, PostAccessTokenRequest>("/auth/login-tokens", {
    username: email,
    password,
    domain,
  }).then((response) => {
    //console.log("Auth Response:", response); // Debug log
    return checkUnauthorized(response);
  });
};

export const postSignup = async (name: string, email: string, password: string) => {
  const domain = `${email}_domain`;

  return await post("/auth/setup-workspace", {
    name,
    domain,
    username: email,
    password,
  }
  ).then(checkUnauthorized);
};

// Handler function for serverless API
export async function handler(req, res) {
  try {
    const method = req.method;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Skip 'api' if it's in the path
    const startIdx = pathParts[0] === 'api' ? 1 : 0;
    
    // Get the auth endpoint (login-tokens, setup-workspace, etc.)
    const authEndpoint = pathParts.length > startIdx + 1 ? pathParts[startIdx + 1] : null;
    
    // Only accept POST requests for authentication
    if (method !== 'POST') {
      return res.status(405).json({ error: "Method not allowed" });
    }
    
    switch (authEndpoint) {
      case 'login-tokens':
        // Handle login request
        const { domain, username, password } = req.body;
        if (!domain || !username || !password) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        
        const loginResponse = await postUserAccessTokens(domain, username, password);
        return res.status(200).json(loginResponse.data);
        
      case 'setup-workspace':
        // Handle signup request
        const { name, email, password: signupPassword } = req.body;
        if (!name || !email || !signupPassword) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        
        const signupResponse = await postSignup(name, email, signupPassword);
        return res.status(201).json(signupResponse.data);
        
      default:
        return res.status(404).json({ error: "Auth endpoint not found" });
    }
  } catch (error) {
    console.error("Authentication API error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
