
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

export function AddLeadsModal({ open, onClose, onSelectSource }: AddLeadsModalProps) {
  const [step, setStep] = useState(1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-slate-900 border-slate-700 text-white">
        <DialogHeader className="border-b border-slate-700 pb-4">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-white text-lg">
              CREATE A LIST OF LEADS BELOW • STEP {step} / 4
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="py-6">
          <h2 className="text-2xl font-semibold mb-8 text-white">How would you like to add leads?</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {leadSources.map((source) => (
              <Card 
                key={source.id}
                className={`bg-slate-800 border-slate-700 hover:border-slate-600 cursor-pointer transition-colors ${
                  !source.available ? 'opacity-60' : ''
                }`}
                onClick={() => source.available && onSelectSource(source.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <source.icon className="h-6 w-6 text-blue-400" />
                      <div className="flex-1">
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {source.title}
                          {!source.available && (
                            <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                              COMING SOON
                            </Badge>
                          )}
                        </h3>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">{source.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
          <Button variant="outline" onClick={onClose} className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button className="bg-slate-700 hover:bg-slate-600 text-white">
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
