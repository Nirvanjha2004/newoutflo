
export type Message = {
  createdAt: number;
  updatedAt: number;
  urn: string;
  senderUrn: string;
  text: string;
  sentAt: number;
};

export type User = {
  id: number;
  userId: string;
  firstName: string;
  lastName: string;
  publicIdentifier: string;
};

export type Conversation = {
  id: string;
  urn: string;
  lastActivityAt: number;
  accountURNs: string[];
  accounts: {
    urn: string;
    firstName: string;
    lastName: string;
  }[];
  lastMessage: {
    senderURN: string;
    text: string;
  };
};

export type ConversationDetail = {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  urn: string;
  lastActivityAt: number;
  accountURNs: string[];
  messages: Message[];
};
