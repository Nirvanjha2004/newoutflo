import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface AsyncButtonProps {
  id?: string;
  onClick: (id?: string) => Promise<any>;
  label: string;
  loadingLabel?: string;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  icon?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export const AsyncButton: React.FC<AsyncButtonProps> = ({
  id,
  onClick,
  label,
  loadingLabel = "Processing...",
  successMessage = "Operation successful",
  errorMessage = "Operation failed",
  onSuccess,
  onError,
  disabled = false,
  variant = "default",
  size = "default",
  icon,
  className,
  fullWidth = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await onClick(id);
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
          variant: "default",
        });
      }
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      console.error("AsyncButton operation failed:", error);
      
      if (errorMessage) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Map old button types to new variants if needed
  const getVariant = () => {
    if (variant === "default") return "default";
    return variant;
  };

  return (
    <Button
      variant={getVariant()}
      size={size}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2",
        fullWidth && "w-full",
        isLoading && "opacity-80",
        className
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        <>
          {icon}
          <span>{label}</span>
        </>
      )}
    </Button>
  );
};
