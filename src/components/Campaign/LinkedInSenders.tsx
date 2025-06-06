import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings, Clock, Loader2 } from 'lucide-react';
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

// Add this utility function for random profile images
const getRandomProfileImage = () => {
  // Total number of profile images available (user1.png through user13.png)
  const totalImages = 13;
  const randomIndex = Math.floor(Math.random() * totalImages) + 1;
  return `/profileImages/user${randomIndex}.png`;
};

interface LinkedInSendersProps {
  selectedAccounts: Account[];
  updateAccounts: (accounts: Account[]) => void;
}

const LinkedInSenders: React.FC<LinkedInSendersProps> = ({ selectedAccounts, updateAccounts }) => {
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
      
      return {
        id: account.id,
        name: `${account.firstName} ${account.lastName}`.substring(0, 20) + 
          (account.firstName?.length + account.lastName?.length > 20 ? '...' : ''),
        // Use real profile picture if available, otherwise use our random image
        profilePicture: account.profilePicture || account._randomProfileImage,
        hasWarning: account.status === 'limited' || account.status === 'warning',
        subscription: account.premiumLevel || 'Free Account',
        activity: `In ${account.campaignCount || 0} campaigns.`,
        selected: selectedAccounts.some(selected => selected.id === account.id),
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-700 mb-4">
          Select multiple sending LinkedIn accounts that you want to use in this campaign:
        </p>
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
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !error && displayAccounts.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-gray-600">No LinkedIn accounts available.</p>
          <Button variant="outline" className="mt-4">
            Connect LinkedIn Account
          </Button>
        </div>
      )}

      {!isLoading && !error && displayAccounts.length > 0 && (
        <div className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12"></TableHead>
                <TableHead className="text-gray-700 font-medium">Name</TableHead>
                <TableHead className="text-gray-700 font-medium">LinkedIn Subscription</TableHead>
                <TableHead className="text-gray-700 font-medium">Activity</TableHead>
                <TableHead className="text-gray-700 font-medium text-center">Configure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAccounts.map((account) => (
                <TableRow
                  key={account.id}
                  className={`transition-colors hover:bg-gray-50 ${
                    account.selected ? 'bg-blue-50' : ''
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={account.selected}
                      onCheckedChange={(checked) => 
                        handleAccountSelect(account.id, checked === true ? true : false)
                      }
                    />
                  </TableCell>
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
                      </div>
                      <span className="text-gray-900 font-medium">{account.name}</span>
                      <span className="text-xs text-gray-500">up to 40 connections/day</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">{account.subscription}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">{account.activity}</span>
                  </TableCell>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default LinkedInSenders;
