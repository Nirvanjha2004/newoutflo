// Import the main router handler
import handler from '../src/api/index';

// Export a function that Vercel will recognize as a serverless function
export default function(req, res) {
  // Pass the request to your consolidated handler
  return handler(req, res);
}