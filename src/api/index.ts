// Import your API handlers
import * as accountsApi from '../api/accounts';
import * as authApi from '../api/authentication';
import * as campaignsApi from '../api/campaigns';
import * as connectionsApi from '../api/connections';
import * as inboxApi from '../api/inbox';
import * as invitationsApi from '../api/invitations';
import * as leadsApi from '../api/leads';
import * as variablesApi from '../api/variables';

export default function handler(req, res) {
  // Get the path from the request URL
  const path = req.url || '';
  
  // Route to appropriate handler based on path segment
  if (path.includes('/api/accounts')) {
    return accountsApi.handler(req, res);
  } else if (path.includes('/api/auth')) {
    return authApi.handler(req, res);
  } else if (path.includes('/api/campaigns')) {
    return campaignsApi.handler(req, res);
  } else if (path.includes('/api/connections')) {
    return connectionsApi.handler(req, res);
  } else if (path.includes('/api/inbox')) {
    return inboxApi.handler(req, res);
  } else if (path.includes('/api/invitations')) {
    return invitationsApi.handler(req, res);
  } else if (path.includes('/api/leads')) {
    return leadsApi.handler(req, res);
  } else if (path.includes('/api/variables')) {
    return variablesApi.handler(req, res);
  }
  
  return res.status(404).json({ error: 'API endpoint not found' });
}