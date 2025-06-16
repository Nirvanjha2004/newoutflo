import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings, Clock, Loader2, XCircle, Eye, Lock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Account } from '@/types/accounts';
import { useQuery } from '@/common/api';
import { getAccounts } from '@/api/accounts';
import { useCampaignStore } from '@/api/store/campaignStore/campaign';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Add this utility function for random profile images
const getRandomProfileImage = () => {
  // Total number of profile images available (user1.png through user13.png)
  const totalImages = 13;
  const randomIndex = Math.floor(Math.random() * totalImages) + 1;
  return `/profileImages/user${randomIndex}.png`;
};

// Add viewMode prop to the interface
interface LinkedInSendersProps {
  selectedAccounts: Account[];
  updateAccounts: (accounts: Account[]) => void;
  viewMode?: boolean;
}

const LinkedInSenders: React.FC<LinkedInSendersProps> = ({ selectedAccounts, updateAccounts, viewMode = false }) => {
  // Use campaign store
  const { setSenderAccounts } = useCampaignStore();
  
  // Use API to fetch accounts
  const { data: fetchedAccounts, isLoading, error } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await getAccounts();
      return response.data;
    },
  });
  
  // Transform fetched accounts to the display format with better profile images
  const formatAccountsForDisplay = (accounts: Account[] = []) => {
    return accounts.map(account => {
      // Ensure each account has a consistent profile image
      // Store the randomly generated image in a property so it doesn't change on re-renders
      if (!account._randomProfileImage) {
        account._randomProfileImage = getRandomProfileImage();
      }
      
      // Check if the account is inactive
      const isInactive = account.status === 'inactive';
      
      return {
        id: account.id,
        name: `${account.firstName} ${account.lastName}`.substring(0, 20) + 
          (account.firstName?.length + account.lastName?.length > 20 ? '...' : ''),
        // Use real profile picture if available, otherwise use our random image
        profilePicture: account.profilePicture || account._randomProfileImage,
        hasWarning: account.status === 'limited' || account.status === 'warning',
        isInactive: isInactive,
        subscription: account.premiumLevel || 'Free Account',
        activity: `In ${account.campaignCount || 0} campaigns.`,
        // Don't allow inactive accounts to be pre-selected
        selected: isInactive ? false : selectedAccounts.some(selected => selected.id === account.id),
        account: account, // Store the full account object for reference
      };
    });
  };

  // Initialize display accounts state
  const [displayAccounts, setDisplayAccounts] = useState<any[]>([]);
  
  // Update display accounts when API data changes
  useEffect(() => {
    if (fetchedAccounts) {
      setDisplayAccounts(formatAccountsForDisplay(fetchedAccounts));
    }
  }, [fetchedAccounts, selectedAccounts]);

  const handleAccountSelect = (accountId: string, checked: boolean) => {
    // Don't allow changes in view mode
    if (viewMode) return;
    
    // Find the account to check if it's inactive
    const account = displayAccounts.find(acc => acc.id === accountId);
    
    // Don't allow selecting inactive accounts
    if (account && account.isInactive) {
      return;
    }
    
    const updatedDisplayAccounts = displayAccounts.map(account => 
      account.id === accountId ? { ...account, selected: checked } : account
    );
    setDisplayAccounts(updatedDisplayAccounts);
    
    // Update parent component with selected accounts
    const newSelectedAccounts = updatedDisplayAccounts
      .filter(account => account.selected)
      .map(account => account.account);
    
    updateAccounts(newSelectedAccounts);
    
    // Save to campaign store
    setSenderAccounts(newSelectedAccounts);
  };

  // Calculate active accounts count
  const activeAccountsCount = fetchedAccounts?.filter(account => account.status !== 'inactive').length || 0;
  const totalAccountsCount = fetchedAccounts?.length || 0;

  // In view mode, we only want to show selected accounts
  const accountsToShow = viewMode
    ? displayAccounts.filter(account => account.selected)
    : displayAccounts;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${viewMode ? 'border-blue-200 relative' : 'border-gray-200'}`}>
      {/* View mode overlay indicator */}
      {viewMode && (
        <div className="absolute top-0 right-0 m-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            View Mode
          </Badge>
        </div>
      )}
      
      <div className="p-6 border-b border-gray-200">
        {viewMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-blue-800 text-sm flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              You are viewing this campaign in read-only mode. Account selections cannot be changed.
            </p>
          </div>
        )}
        
        <p className="text-gray-700 mb-4">
          {viewMode 
            ? 'LinkedIn accounts used in this campaign:' 
            : 'Select multiple sending LinkedIn accounts that you want to use in this campaign:'}
        </p>
        
        {!viewMode && activeAccountsCount < totalAccountsCount && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {activeAccountsCount === 0 ? (
                <span>All accounts are inactive. Please reactivate accounts before creating campaigns.</span>
              ) : (
                <span>{totalAccountsCount - activeAccountsCount} of {totalAccountsCount} accounts are inactive and cannot be selected.</span>
              )}
            </p>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Loading LinkedIn accounts...</p>
        </div>
      )}

      {error && (
        <div className="p-8 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
          <p className="mt-2 text-gray-700">Error loading accounts. Please try again.</p>
          <Button 
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
            disabled={viewMode}
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && displayAccounts.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-600">No LinkedIn accounts available.</p>
          {!viewMode && (
            <Button variant="outline" className="mt-4">
              Connect LinkedIn Account
            </Button>
          )}
        </div>
      )}

      {!isLoading && !error && accountsToShow.length === 0 && viewMode && (
        <div className="p-8 text-center">
          <p className="text-gray-600">No LinkedIn accounts were selected for this campaign.</p>
        </div>
      )}

      {!isLoading && !error && accountsToShow.length > 0 && (
        <div className={`overflow-hidden ${viewMode ? 'bg-gray-50/50' : ''}`}>
          <Table>
            <TableHeader>
              <TableRow className={`${viewMode ? 'bg-blue-50/50' : 'bg-gray-50'}`}>
                {!viewMode && <TableHead className="w-12"></TableHead>}
                <TableHead className="text-gray-700 font-medium">Name</TableHead>
                <TableHead className="text-gray-700 font-medium">LinkedIn Subscription</TableHead>
                <TableHead className="text-gray-700 font-medium">Activity</TableHead>
                {/* {!viewMode && <TableHead className="text-gray-700 font-medium text-center">Configure</TableHead>} */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountsToShow.map((account) => (
                <TableRow
                  key={account.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    account.selected ? 'bg-blue-50/70' : ''
                  } ${account.isInactive ? 'opacity-60' : ''}`}
                >
                  {!viewMode && (
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <Checkbox
                                checked={account.selected}
                                disabled={account.isInactive || viewMode}
                                onCheckedChange={(checked) => 
                                  handleAccountSelect(account.id, checked === true ? true : false)
                                }
                                className={(account.isInactive || viewMode) ? 'cursor-not-allowed' : ''}
                              />
                            </div>
                          </TooltipTrigger>
                          {account.isInactive && (
                            <TooltipContent>
                              <p>This account is inactive and cannot be selected</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={account.profilePicture}
                          alt={account.name}
                          className="w-8 h-8 rounded-full bg-gray-200 object-cover"
                          onError={(e) => {
                            // Fallback to a random profile image if loading fails
                            (e.target as HTMLImageElement).src = getRandomProfileImage();
                          }}
                        />
                        {account.hasWarning && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 absolute -top-1 -right-1" />
                        )}
                        {account.isInactive && (
                          <XCircle className="w-4 h-4 text-red-500 absolute -top-1 -right-1" />
                        )}
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">{account.name}</span>
                        {account.isInactive && (
                          <Badge variant="destructive" className="ml-2 text-xs">Inactive</Badge>
                        )}
                        <span className="block text-xs text-gray-500">up to 40 connections/day</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">{account.subscription}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">
                      {account.isInactive ? (
                        <span className="text-red-600">Account inactive</span>
                      ) : (
                        account.activity
                      )}
                    </span>
                  </TableCell>
                  {/* {!viewMode && (
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="ghost" size="sm" className="p-2">
                          <Settings className="w-4 h-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                        </Button>
                      </div>
                    </TableCell>
                  )} */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Display selected count in view mode */}
          {viewMode && accountsToShow.length > 0 && (
            <div className="p-3 bg-blue-50/60 text-blue-700 text-sm border-t border-blue-100">
              <span className="font-medium">{accountsToShow.length}</span> LinkedIn {accountsToShow.length === 1 ? 'account' : 'accounts'} used in this campaign
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LinkedInSenders;
