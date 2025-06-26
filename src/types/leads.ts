
export type LeadSource = 
  | "basic-linkedin"
  | "sales-navigator" 
  | "recruiter"
  | "event-members"
  | "group-members"
  | "my-network"
  | "csv-upload"
  | "paste-urls";

export type ColumnType = 
  | "url"
  | "first-name"
  | "last-name" 
  | "full-name"
  | "head-line"
  | "email"
  | "job-title"
  | "tags"
  | "do-not-import"
  | "company-url";

export type CSVColumn = {
  name: string;
  type: ColumnType;
  samples: string[];
};

export type CSVData = {
  fileName: string;
  fileSize: string;
  columns: CSVColumn[];
  rowCount: number;
};

export type Lead = {
  id: string;
  url?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  headline?: string;
  email?: string;
  jobTitle?: string;
  tags?: string[];
  firstPara?: string;
};
