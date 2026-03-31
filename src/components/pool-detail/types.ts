import type { Id } from "@convex/dataModel";

export type PoolStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";

export type PoolPaymentDetails = {
  upiId?: string;
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  note?: string;
};

export type PoolOrganizer = {
  _id: Id<"users">;
  name: string;
  phone: string;
  verificationStatus: string;
};

export type PoolConfig = {
  totalValue: number;
  totalSeats: number;
  contribution: number;
  currency?: string;
  frequency: "monthly" | "weekly" | "biweekly" | "quarterly" | "occasional";
  duration: number;
  commission?: number;
  gracePeriodDays?: number;
};

export type PoolSeat = {
  _id: Id<"seats"> | string;
  seatNumber: number;
  status: "OPEN" | "RESERVED" | "FILLED";
  userId?: Id<"users"> | null;
  user?: {
    _id: Id<"users">;
    name: string;
    phone: string;
    pictureUrl?: string | null;
    verificationStatus?: string;
  } | null;
  isGuest?: boolean;
  isCoSeat?: boolean;
  roundWon?: number;
  coOwners?: Array<{
    userId: Id<"users">;
    userName?: string;
    userPhone?: string;
    userPictureUrl?: string | null;
    sharePercentage: number;
    status?: string;
    isGuest?: boolean;
  }>;
  remainingPercentage?: number;
};

export type PoolDetail = {
  _id: Id<"pools">;
  title: string;
  organizerId: Id<"users">;
  organizer?: PoolOrganizer | null;
  terms?: string;
  paymentDetails?: PoolPaymentDetails;
  drawStrategy?: "RANDOM" | "MANUAL";
  startDate?: number;
  nextDrawDate?: number;
  config: PoolConfig;
  status: PoolStatus;
  currentRound: number;
  seats?: PoolSeat[];
};

export type PoolTransaction = {
  _id: Id<"transactions">;
  poolId: Id<"pools">;
  seatId: Id<"seats">;
  userId?: Id<"users"> | null;
  roundIndex: number;
  status: "UNPAID" | "PENDING" | "PAID";
  type?: "cash" | "online" | "upi" | "payout";
  paidAt?: number;
  proofUrl?: string;
  remarks?: string;
  initiatedAt?: number;
  paymentApp?: string;
  upiDeepLinkUsed?: string;
  seat?: { seatNumber?: number } | null;
  user?: { name?: string; phone?: string; pictureUrl?: string | null } | null;
};
