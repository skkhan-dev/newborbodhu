export type GhotokDashboardResponse = {
  profile: {
    id: string;
    displayName: string;
    status: string;
    email: string | null;
    phone: string | null;
    photoUrl?: string | null;
    bioEn?: string | null;
    bioBn?: string | null;
    address?: string | null;
    feeAmount?: number | null;
    feeCurrency?: string | null;
  };
  wallet: {
    balance: number;
  };
  managedCounts: Array<{
    _count: {
      status: number;
    };
    status: string;
  }>;
  recentLedger: Array<{
    id: string;
    amount: number;
    balanceAfter: number;
    entryType: string;
    notes: string | null;
    createdAt: string;
  }>;
};
