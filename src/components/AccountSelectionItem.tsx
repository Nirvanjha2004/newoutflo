import { Account } from "../types/accounts";
import { Badge } from "@/components/ui/badge";
import { SyncState } from "../constants/accountConstant";

interface AccountSelectItemProps {
  account: Account;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export function AccountSelectItem({ account, selected, onSelect }: AccountSelectItemProps) {
  const isInactive = account.status === SyncState.INACTIVE;

  return (
    <div className={`flex items-center p-3 rounded-md border ${selected ? 'border-primary bg-blue-50' : 'border-gray-200'} ${isInactive ? 'opacity-60' : ''}`}>
      <input 
        type="checkbox" 
        checked={selected}
        onChange={(e) => onSelect(account.id, e.target.checked)}
        disabled={isInactive}
        className="mr-3"
      />
      
      <div className="flex-1">
        <div className="flex items-center">
          <span className="font-medium">{account.name}</span>
          {isInactive && (
            <Badge variant="destructive" className="ml-2">Inactive</Badge>
          )}
        </div>
        <div className="text-sm text-gray-500">{account.email}</div>
      </div>
      
      {isInactive && (
        <div className="text-xs text-red-500 ml-2">
          Account inactive due to repeated failures
        </div>
      )}
    </div>
  );
}