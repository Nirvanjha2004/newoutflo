import { useState } from "react";
import { Search, Settings, User, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import LinkedInConnectionModal from "@/components/LinkedinConnectionModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccountsQuery } from "../hooks/useAccountQueries";
import { Account, SyncState } from "../types/accounts";
import { useDeleteAccountMutation } from "@/hooks/useAccountMutations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import SenderLimitsDrawer from "@/components/SenderLimitsDrawer";

interface SenderLimitsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

// Add this utility function at the top of your file
const getRandomProfileImage = () => {
  // Total number of profile images available (user1.png through user13.png)
  const totalImages = 13;
  const randomIndex = Math.floor(Math.random() * totalImages) + 1;
  return `/profileImages/user${randomIndex}.png`;
};

// Create content component to be wrapped in layout
const AccountsContent = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "connected" | "disconnected">("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const deleteAccount = useDeleteAccountMutation();
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [isLimitsDrawerOpen, setIsLimitsDrawerOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { data: accounts = [], isLoading, error } = useAccountsQuery();

  console.log("Accounts data:", accounts);
  // Filter accounts based on search term and status
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = `${account.firstName} ${account.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "connected" && account.status === SyncState.ACTIVE) ||
      (statusFilter === "disconnected" && account.status === SyncState.INACTIVE);

    return matchesSearch && matchesStatus;
  });

  const handleConfigureLimits = (account: Account) => {
    setSelectedAccount(account);
    setIsLimitsDrawerOpen(true);
  };

  const getStatusInfo = (account: Account) => {
    switch (account.status) {
      case SyncState.ACTIVE:
        return {
          text: "Active",
          className: "bg-blue-100 text-blue-600"
        };
      case SyncState.INACTIVE:
        return {
          text: "Not connected",
          className: "bg-red-100 text-red-600"
        };
      case SyncState.DELETED:
        return {
          text: "Deleted",
          className: "bg-gray-100 text-gray-600"
        };
      default:
        return {
          text: "Unknown",
          className: "bg-gray-100 text-gray-600"
        };
    }
  };

  const handleDeleteClick = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    if (accountToDelete) {
      deleteAccount.mutate(accountToDelete.id);
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  };

  // This ensures consistent profile images for the same account
  const getAccountProfileImage = (account: Account) => {
    // Return the actual profile image if it exists

    // console.log("The current acccount is "  , account)
    // console.log("the current profile image is ", account.profileImageUrl)
    if (account.profileImageUrl) {
      const cleanUrl = account.profileImageUrl.replace(/"/g, '');
      return cleanUrl;
    }

    // console.log("The Profile image url is",account.profileImageUrl)

    // Otherwise, use the deterministic random image as fallback
    const hash = account.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const imageIndex = (hash % 13) + 1; // 1-13 range
    return `/profileImages/user${imageIndex}.png`;
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading accounts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-red-500">Error loading accounts</div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#edecfe]/20">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-white">
        {/* <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Account Center</h1>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-[#5a41cd]">
              <Settings size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-[#5a41cd]">
              <User size={14} />
            </Button>
          </div>
        </div> */}

        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            LinkedIn <span className="text-[#5a41cd]">Accounts</span>
          </h2>
          <p className="text-sm text-gray-600">Manage your LinkedIn sending accounts and campaigns</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1">
              <p className="text-blue-800 text-xs">
                The LinkedIn accounts are called senders when put in a campaign. Connect multiple LinkedIn sending accounts on one campaign to increase your daily sending volume.
              </p>
            </div>
            {/* <div className="flex-shrink-0">
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                Unlimited slots available
              </Badge> */}
            {/* </div> */}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <Input
                placeholder="Search senders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-48 h-8 text-sm focus:border-[#5a41cd] focus:ring-[#5a41cd]"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | "connected" | "disconnected")}
            >
              <SelectTrigger className="w-32 h-8 text-sm border-gray-200 focus:border-[#5a41cd]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="disconnected">Disconnected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="bg-[#5a41cd] hover:bg-[#5a41cd]/90 text-white h-8 text-xs"
              onClick={() => setShowLinkedInModal(true)}
            >
              <span className="mr-1">+</span>
              Connect account
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="font-medium text-gray-700 text-sm">LinkedIn Account</div>
            <div className="font-medium text-gray-700 text-sm">Status</div>
            <div className="font-medium text-gray-700 text-sm">Todays Activities</div>
            <div className="font-medium text-gray-700 text-sm"></div>
          </div>

          {/* Table Rows */}
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => {
              const initials = `${account.firstName?.[0] || ''}${account.lastName?.[0] || ''}`;
              const fullName = `${account.firstName || ''} ${account.lastName || ''}`;
              const statusInfo = getStatusInfo(account);

              return (
                <div key={account.id} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-gray-100 hover:bg-[#edecfe]/10 transition-colors">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <img
                        src={getAccountProfileImage(account)}
                        alt={fullName}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <AvatarFallback className="bg-[#5a41cd]/10 text-[#5a41cd] font-semibold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 text-sm">{fullName}</span>
                        {account.isPremium && (
                          <Badge className="ml-2 bg-amber-100 text-amber-700 border-amber-200 h-5 text-[10px]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                              <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                            </svg>
                            Premium
                          </Badge>
                        )}
                      </div>
                      {/* You can optionally add a subtitle here if needed */}
                    </div>
                  </div>

                  <div>
                    <Badge className={`${statusInfo.className} text-xs`}>
                      {statusInfo.text}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-gray-600">
                    {/* <div className="flex items-center space-x-1">
                      <span className="text-gray-500">📤</span>
                      <span>{account.accountActions?.dailyConnectionLimit || 0}/day</span>
                      {account.accountActions?.weeklyConnectionLimitExceeded && (
                        <span className="text-red-500 ml-1">(Exceeded)</span>
                      )}
                    </div> */}
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500">📅</span>
                      <span>{account.accountActions?.sendConnectionReq || 0} invitations sent</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-gray-500">👥</span>
                      <span>{account.accountActions?.sendMessage || 0} messages sent</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    {account.status === SyncState.INACTIVE ? (
                      null
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-[#5a41cd]/20 text-[#5a41cd] hover:bg-[#5a41cd]/10"
                        onClick={() => handleConfigureLimits(account)}
                      >
                        <Settings size={10} className="mr-1" />
                        Configure limits
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-[#5a41cd]/10 hover:text-[#5a41cd]">
                          <MoreHorizontal size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(account)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              No accounts found matching your filters.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>Showing {filteredAccounts.length > 0 ? `1-${filteredAccounts.length} of ${filteredAccounts.length}` : '0 accounts'}</span>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
              Previous
            </Button>
            <Button variant="ghost" size="sm" disabled className="h-7 text-xs">
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {accountToDelete?.firstName}'s account?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="h-9 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="h-9 bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LinkedIn Connection Modal */}
      <LinkedInConnectionModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
      />

      {/* Sender Limits Drawer */}
      <SenderLimitsDrawer
        isOpen={isLimitsDrawerOpen}
        onClose={() => setIsLimitsDrawerOpen(false)}
        account={selectedAccount}
      />
    </div>
  );
};

// Main component wrapping the content in the layout
const Accounts = () => {
  return (
    <DashboardLayout activePage="accounts">
      <AccountsContent />
    </DashboardLayout>
  );
};

export default Accounts;
