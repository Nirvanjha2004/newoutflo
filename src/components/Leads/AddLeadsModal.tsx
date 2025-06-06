import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Linkedin, Settings, Search, Calendar, Users, Network, Upload, LinkIcon } from "lucide-react";
import { LeadSource } from "@/types/leads";

interface AddLeadsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectSource: (source: LeadSource) => void;
  theme?: "dark" | "light";
}

const leadSources = [
  {
    id: "basic-linkedin" as LeadSource,
    title: "Basic LinkedIn Search",
    description: "Add profiles from the search page of the free LinkedIn version",
    icon: Linkedin,
    available: true
  },
  {
    id: "sales-navigator" as LeadSource,
    title: "LinkedIn Sales Navigator Search", 
    description: "Transfer profiles from the search panel of Sales Navigator",
    icon: Settings,
    available: true
  },
  {
    id: "recruiter" as LeadSource,
    title: "LinkedIn Recruiter Search",
    description: "Add profiles from the search page of LinkedIn Recruiter", 
    icon: Search,
    available: true
  },
  {
    id: "event-members" as LeadSource,
    title: "LinkedIn Event Members",
    description: "Retrieve members of the LinkedIn event you're attending",
    icon: Calendar,
    available: true
  },
  {
    id: "group-members" as LeadSource,
    title: "LinkedIn Group Members",
    description: "Scrape members of the LinkedIn group you're part of",
    icon: Users,
    available: false
  },
  {
    id: "my-network" as LeadSource,
    title: "My Network", 
    description: "Transfer first-level connections from the 'My Network' page",
    icon: Network,
    available: true
  },
  {
    id: "csv-upload" as LeadSource,
    title: "Upload CSV file",
    description: "Add LinkedIn profiles from a CSV file",
    icon: Upload,
    available: true
  },
  {
    id: "paste-urls" as LeadSource,
    title: "Paste profile URLs",
    description: "Add profiles by pasting the LinkedIn profile URLs",
    icon: LinkIcon,
    available: true
  }
];

export function AddLeadsModal({ open, onClose, onSelectSource, theme = "dark" }: AddLeadsModalProps) {
  const [step, setStep] = useState(1);

  const modalBg = theme === "dark" 
    ? "bg-[#252037]/90 backdrop-blur-md border border-[#382f53]"
    : "bg-white border border-gray-200";
  const headerBorder = theme === "dark" ? "border-[#382f53]" : "border-gray-200";
  const cardBg = theme === "dark" ? "bg-[#1e1a2e]" : "bg-gray-50";
  const cardBorder = theme === "dark" ? "border-[#382f53]" : "border-gray-200";
  const textColor = theme === "dark" ? "text-white" : "text-gray-900";
  const textSecondary = theme === "dark" ? "text-slate-400" : "text-gray-500";
  const buttonPrimary = theme === "dark" ? "bg-[#7c3aed] hover:bg-[#6d28d9]" : "bg-purple-600 hover:bg-purple-700";
  const buttonGhost = theme === "dark" 
    ? "text-slate-300 hover:text-white hover:bg-[#2e2844]"
    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={`max-w-4xl max-h-[80vh] overflow-y-auto ${modalBg} ${textColor} shadow-xl`}
        style={{ 
          backdropFilter: theme === "dark" ? 'blur(8px)' : 'none'
        }}
      >
        <DialogHeader className={`border-b ${headerBorder} pb-3`}>
          <div className="flex items-center gap-4">
            <DialogTitle className={`${textColor} text-sm font-medium`}>
              CREATE A LIST OF LEADS • STEP {step}/4
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-4">
          <h2 className={`text-xl font-semibold mb-6 ${textColor}`}>How would you like to add leads?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {leadSources.map((source) => (
              <Card 
                key={source.id}
                className={`${cardBg} ${cardBorder} hover:border-${theme === "dark" ? "[#4e3d72]" : "purple-300"} cursor-pointer transition-colors ${
                  !source.available ? 'opacity-60' : ''
                }`}
                onClick={() => source.available && onSelectSource(source.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <source.icon className={`h-5 w-5 ${theme === "dark" ? "text-indigo-400" : "text-purple-600"}`} />
                      <div className="flex-1">
                        <h3 className={`${textColor} text-sm font-medium flex items-center gap-2`}>
                          {source.title}
                          {!source.available && (
                            <Badge variant="secondary" className={`${theme === "dark" ? "bg-[#2a2139] text-slate-300" : "bg-gray-100 text-gray-500"} text-xs`}>
                              COMING SOON
                            </Badge>
                          )}
                        </h3>
                      </div>
                    </div>
                    <p className={`${textSecondary} text-xs`}>{source.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className={`flex justify-end gap-3 border-t ${headerBorder} pt-3`}>
          <Button 
            variant="ghost" 
            onClick={onClose} 
            className={buttonGhost}
          >
            Cancel
          </Button>
          <Button 
            className={`${buttonPrimary} text-white text-sm px-4 py-2`}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
