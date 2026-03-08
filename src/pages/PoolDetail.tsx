import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";

import { LogoLoader } from "@/components/ui/LogoLoader";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { PoolHero } from "@/components/pool-detail/PoolHero";
import { PoolTabNav, type PoolTab } from "@/components/pool-detail/PoolTabNav";
import { OverviewTab } from "@/components/pool-detail/OverviewTab";
import { SeatsTab } from "@/components/pool-detail/SeatsTab";
import { MembersTab } from "@/components/pool-detail/MembersTab";
import { RulesTab } from "@/components/pool-detail/RulesTab";
import { HistoryTab } from "@/components/pool-detail/HistoryTab";
import { OrganizerTab } from "@/components/pool-detail/OrganizerTab";
import { JoinPoolModal } from "@/components/pool-detail/modals/JoinPoolModal";
import { AddMemberModal } from "@/components/pool-detail/modals/AddMemberModal";
import { AssignCoSeatModal } from "@/components/pool-detail/modals/AssignCoSeatModal";
import { EditGuestModal } from "@/components/pool-detail/modals/EditGuestModal";
import { PaymentModal } from "@/components/pool-detail/modals/PaymentModal";
import { WinnerSelectionModal } from "@/components/pool-detail/modals/WinnerSelectionModal";
import { NextRoundModal } from "@/components/pool-detail/modals/NextRoundModal";
import { RunDrawAnimationModal } from "@/components/pool-detail/modals/RunDrawAnimationModal";
import { DeletePoolModal } from "@/components/pool-detail/modals/DeletePoolModal";
import { ArchivePoolModal } from "@/components/pool-detail/modals/ArchivePoolModal";
import { RecordPayoutModal } from "@/components/pool-detail/modals/RecordPayoutModal";
import { RecordCashModal } from "@/components/pool-detail/modals/RecordCashModal";
import { useFeedback } from "@/components/shared/FeedbackProvider";
import { getNextRoundDate, getPoolDisplayProgress, getSeatStats, getVirtualOpenSeats } from "@/lib/pool";
import type { PoolDetail as PoolDetailType, PoolSeat, PoolTransaction } from "@/components/pool-detail/types";

import { api } from "@convex/api";
import type { Id } from "@convex/dataModel";

export function PoolDetail() {
  const { poolId } = useParams<{ poolId: string }>();
  const navigate = useNavigate();
  const feedback = useFeedback();

  const pool = useQuery(api.pools.get, { poolId: poolId as Id<"pools"> }) as PoolDetailType | null | undefined;
  const currentUser = useQuery(api.users.current);
  const transactions = useQuery(api.transactions.list, { poolId: poolId as Id<"pools"> }) as PoolTransaction[] | undefined;

  const activatePool = useMutation(api.pools.activate);
  const deleteSeat = useMutation(api.seats.deleteSeat);
  const runDraw = useMutation(api.draw.runDraw);
  const advanceRound = useMutation(api.draw.advanceRound);
  const approvePayment = useMutation(api.transactions.approvePayment);
  const rejectPayment = useMutation(api.transactions.rejectPayment);
  const recordCashPayment = useMutation(api.transactions.recordCashPayment);
  const archivePool = useMutation(api.pools.archivePool);
  const unarchivePool = useMutation(api.pools.unarchivePool);
  const deletePool = useMutation(api.pools.deletePool);

  const [activeTab, setActiveTab] = useState<PoolTab>("rules");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAssignCoSeat, setShowAssignCoSeat] = useState(false);
  const [showEditGuest, setShowEditGuest] = useState(false);
  const [editingGuest, setEditingGuest] = useState<{ id: Id<"users">; name: string; phone: string } | null>(null);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);
  const [showNextRound, setShowNextRound] = useState(false);
  const [showDrawAnimation, setShowDrawAnimation] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeletePool, setShowDeletePool] = useState(false);
  const [showRecordPayout, setShowRecordPayout] = useState(false);
  const [showRecordCash, setShowRecordCash] = useState(false);
  const [paymentState, setPaymentState] = useState<{
    seatId: Id<"seats">;
    roundIndex: number;
    amount: number;
    isOrganizer?: boolean;
  } | null>(null);

  const [isGuestMember, setIsGuestMember] = useState(false);

  const seats = pool?.seats ?? [];

  useEffect(() => {
    if (!pool) return;
    const ghost = localStorage.getItem("unigro_ghost_memberships");
    const guest = localStorage.getItem("unigro_guest_memberships");
    const guestIds = JSON.parse(guest || ghost || "[]") as string[];
    if (!currentUser && guestIds.length > 0) {
      const joined = seats.some((seat) => seat.userId && guestIds.includes(seat.userId as string));
      setIsGuestMember(joined);
    } else {
      setIsGuestMember(false);
    }
  }, [currentUser, pool, seats]);

  const isOrganizer = !!currentUser?._id && !!pool?.organizerId && currentUser._id === pool.organizerId;

  const mySeats: PoolSeat[] = useMemo(() => {
    if (!pool) return [];
    if (currentUser?._id) {
      return seats.filter(
        (seat) =>
          seat.userId === currentUser._id ||
          (seat.isCoSeat && seat.coOwners?.some((owner) => owner.userId === currentUser._id))
      );
    }
    if (isGuestMember) {
      const ghost = localStorage.getItem("unigro_ghost_memberships");
      const guest = localStorage.getItem("unigro_guest_memberships");
      const guestIds = JSON.parse(guest || ghost || "[]") as string[];
      return seats.filter((seat) => seat.userId && guestIds.includes(seat.userId as string));
    }
    return [];
  }, [currentUser, isGuestMember, pool, seats]);

  const isMember = mySeats.length > 0 || isGuestMember;

  const memberCount = useMemo(() => {
    const ids = new Set<string>();
    seats.forEach((seat) => {
      if (seat.userId) ids.add(seat.userId as string);
      seat.coOwners?.forEach((owner) => ids.add(owner.userId as string));
    });
    return ids.size;
  }, [seats]);

  const fullSeats = useMemo(() => {
    if (!pool) return [];
    const virtual = getVirtualOpenSeats(
      { status: pool.status, currentRound: pool.currentRound, config: pool.config, seats },
      seats
    ).map((seat) => ({
      _id: seat._id,
      seatNumber: seat.seatNumber,
      status: "OPEN" as const,
    } as PoolSeat));

    return [...seats, ...virtual].sort((a, b) => a.seatNumber - b.seatNumber);
  }, [pool, seats]);

  useEffect(() => {
    if (pool === undefined || currentUser === undefined) return;
    setActiveTab((prev) => {
      if (prev !== "rules") return prev;
      if (isOrganizer) return "organizer";
      return isMember ? "overview" : "rules";
    });
  }, [isMember, isOrganizer, pool, currentUser]);

  if (pool === undefined || transactions === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LogoLoader size="lg" />
      </div>
    );
  }

  if (pool === null) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <h1 className="text-xl font-semibold">Pool not found</h1>
        <p className="text-sm text-[var(--text-muted)]">The pool may have been deleted or the link is invalid.</p>
      </div>
    );
  }

  const { filledSeats, availableSeats, hasOpenSeats } = getSeatStats(pool, seats);
  const progressInfo = getPoolDisplayProgress(pool, seats, transactions);
  const grace = pool.config.gracePeriodDays ?? 0;

  const nextDueDate = getNextRoundDate(pool.startDate, pool.currentRound, pool.config.frequency).dateStr;
  const nextDrawDate = getNextRoundDate(pool.startDate, pool.currentRound, pool.config.frequency, grace, pool.nextDrawDate).dateStr;

  const pendingApprovals = transactions.filter((tx) => tx.status === "PENDING");

  const eligibleDrawSeats = seats
    .filter((seat) => seat.status === "FILLED" && (seat.userId || seat.isCoSeat) && !seat.roundWon)
    .map((seat) => {
      let displayName = seat.user?.name;
      if (!displayName && seat.isCoSeat && seat.coOwners) {
        displayName = seat.coOwners.map(co => co.userName).join(" & ");
      }
      return {
        seatId: seat._id as Id<"seats">,
        seatNumber: seat.seatNumber,
        userName: displayName || "Member"
      };
    });

  const payoutSeatOptions = seats
    .filter((seat) => seat.roundWon !== undefined)
    .sort((a, b) => (b.roundWon || 0) - (a.roundWon || 0))
    .map((seat) => {
      let winnerName = seat.user?.name;
      if (!winnerName && seat.isCoSeat && seat.coOwners) {
        winnerName = seat.coOwners.map(co => co.userName).join(" & ");
      }
      return {
        seatId: seat._id as Id<"seats">,
        seatNumber: seat.seatNumber,
        roundWon: seat.roundWon,
        userName: winnerName || "Member"
      };
    });

  const handleActivate = async () => {
    if (availableSeats > 0) {
      feedback.toast.info("Cannot activate yet", `${availableSeats} seats are still open.`);
      return;
    }
    const ok = await feedback.confirm({
      title: "Activate pool?",
      message: "Financial rules will be locked after activation.",
      confirmText: "Activate",
    });
    if (!ok) return;
    try {
      await activatePool({ poolId: pool._id });
      feedback.toast.success("Pool activated", "Members can now start payments.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to activate pool.";
      feedback.toast.error("Activation failed", msg);
    }
  };

  const handleRunDraw = async (seatNumber?: number) => {
    try {
      const result = await runDraw({ poolId: pool._id, customWinnerSeatNumber: seatNumber });
      return result as number; // Return the winning seat number
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to run draw.";
      feedback.toast.error("Draw failed", msg);
      throw error;
    }
  };

  const handleAdvanceRound = async (nextDraw: number) => {
    try {
      await advanceRound({ poolId: pool._id, nextDrawDate: nextDraw });
      feedback.toast.success("Round advanced", "Next round has started.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to advance round.";
      feedback.toast.error("Advance failed", msg);
    }
  };

  const handleDeleteSeat = async (seatNumber: number) => {
    try {
      await deleteSeat({ poolId: pool._id, seatNumber });
      feedback.toast.success("Seat removed");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete seat.";
      feedback.toast.error("Delete failed", msg);
    }
  };

  const handleApprove = async (txId: string, paidAt?: number) => {
    const tx = transactions?.find(t => t._id === txId);
    if (!tx) return;

    try {
      if (tx.type === "cash") {
        await recordCashPayment({
          poolId: pool!._id,
          seatId: tx.seatId as Id<"seats">,
          roundIndex: tx.roundIndex,
          userId: tx.userId || undefined,
          paidAt
        });
      } else {
        await approvePayment({ transactionId: txId as Id<"transactions"> });
      }
      feedback.toast.success("Payment approved");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Approval failed";
      feedback.toast.error("Process failed", msg);
    }
  };

  const handleReject = async (txId: string, notes?: string) => {
    try {
      await rejectPayment({ transactionId: txId as Id<"transactions">, notes });
      feedback.toast.success("Payment rejected");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Rejection failed";
      feedback.toast.error("Process failed", msg);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: pool.title, url });
        return;
      } catch (e) {
        // fallback to clipboard
      }
    }
    await navigator.clipboard.writeText(url);
    feedback.toast.success("Link copied", "Pool link copied to clipboard.");
  };

  const handleDeletePool = async () => {
    try {
      await deletePool({ poolId: pool._id });
      feedback.toast.success("Pool deleted");
      navigate("/pools");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to delete pool.";
      feedback.toast.error("Delete failed", msg);
    }
  };

  const handleArchivePool = async () => {
    try {
      await archivePool({ poolId: pool!._id });
      feedback.toast.success("Pool archived", "Management actions are now disabled.");
      setShowArchiveModal(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to archive pool.";
      feedback.toast.error("Archive failed", msg);
    }
  };

  const handleUnarchivePool = async () => {
    try {
      await unarchivePool({ poolId: pool!._id });
      feedback.toast.success("Pool restored", "Management actions are now enabled.");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to unarchive pool.";
      feedback.toast.error("Process failed", msg);
    }
  };


  const isRestricted = pool.status === "ACTIVE" && !isMember && !isOrganizer;
  const showJoinAction = hasOpenSeats && !isOrganizer && !isRestricted;

  return (
    <div className="flex min-h-dvh w-full max-w-full flex-col bg-[var(--bg-app)]">
      <DetailHeader
        title={pool.title}
        isOrganizer={isOrganizer}
        organizer={pool.organizer}
        onShare={handleShare}
        onEdit={() => navigate(`/create?edit=${pool._id}`)}
        onJoin={showJoinAction ? () => setShowJoinModal(true) : undefined}
      />

      <div className="w-full max-w-full space-y-6 px-4 pb-12 pt-4 sm:px-6">
        <PoolHero
          pool={pool}
          seats={fullSeats}
          transactions={transactions}
          isOrganizer={isOrganizer}
          isDraft={pool.status === "DRAFT"}
          hasOpenSeats={hasOpenSeats}
          isMember={isMember}
          filledCount={filledSeats}
          progressLabel={progressInfo.label}
          progressValue={progressInfo.percent}
          progressCount={progressInfo.count}
          progressTotal={progressInfo.total}
          isRestricted={isRestricted}
          onSeatClick={(_seat, isOpen) => {
            if (isOpen) setShowJoinModal(true);
          }}
          onContact={pool.organizer?.phone ? () => {
            const tel = `tel:${pool.organizer?.phone}`;
            window.location.href = tel;
          } : undefined}
        />

        {!isRestricted && (
          <PoolTabNav
            activeTab={activeTab}
            onChange={setActiveTab}
            showOrganizer={isOrganizer}
            showMemberTabs={isMember || isOrganizer}
            memberCount={memberCount}
            pendingApprovals={pendingApprovals.length}
          />
        )}

        {isRestricted ? null : (
          <>
            {activeTab === "overview" && (
              <OverviewTab
                pool={pool}
                mySeats={mySeats}
                transactions={transactions}
                currentUserId={currentUser?._id}
                nextDueDate={nextDueDate}
                onPay={(seatId, roundIndex, amount) => setPaymentState({ seatId: seatId as Id<"seats">, roundIndex, amount })}
                onViewHistory={() => setActiveTab("history")}
              />
            )}

            {activeTab === "seats" && (
              <SeatsTab
                pool={pool}
                seats={seats}
                currentUserId={currentUser?._id}
                isOrganizer={isOrganizer}
                isDraft={pool.status === "DRAFT"}
                isMember={isMember}
                onAddMember={() => setShowAddMember(true)}
                onAssignCoSeat={() => setShowAssignCoSeat(true)}
                onDeleteSeat={handleDeleteSeat}
                onJoin={() => setShowJoinModal(true)}
                onEditGuest={(guestId, name, phone) => {
                  setEditingGuest({ id: guestId, name, phone });
                  setShowEditGuest(true);
                }}
              />
            )}

            {activeTab === "members" && (
              <MembersTab
                pool={pool}
                seats={seats}
                currentUserId={currentUser?._id}
                isOrganizer={isOrganizer}
                transactions={transactions}
                onEditGuest={(guestId, name, phone) => {
                  setEditingGuest({ id: guestId, name, phone });
                  setShowEditGuest(true);
                }}
              />
            )}

            {activeTab === "rules" && (
              <RulesTab
                pool={pool}
                nextDrawDate={nextDrawDate}
                isMember={isMember}
                onJoin={() => setShowJoinModal(true)}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab
                pool={pool}
                seats={seats}
                transactions={transactions}
                mySeats={mySeats}
                currentUserId={currentUser?._id}
                onPay={(seatId, roundIndex, amount) => setPaymentState({ seatId: seatId as Id<"seats">, roundIndex, amount })}
              />
            )}

            {activeTab === "organizer" && (
              <OrganizerTab
                pool={pool}
                pendingTransactions={pendingApprovals}
                onApprove={handleApprove}
                onReject={handleReject}
                onOpenCashPayment={() => setShowRecordCash(true)}
                onOpenWinnerSelection={() => setShowWinnerSelection(true)}
                onOpenNextRound={() => setShowNextRound(true)}
                onOpenPayout={() => setShowRecordPayout(true)}
                onActivatePool={handleActivate}
                onArchivePool={() => setShowArchiveModal(true)}
                onUnarchivePool={handleUnarchivePool}
                onDeletePool={() => setShowDeletePool(true)}
              />
            )}
          </>
        )}

        <JoinPoolModal
          open={showJoinModal}
          onOpenChange={setShowJoinModal}
          poolId={pool._id}
          totalSeats={pool.config.totalSeats}
          filledSeats={filledSeats}
          contribution={pool.config.contribution}
          totalValue={pool.config.totalValue}
          currency={pool.config.currency}
          isAuthenticated={!!currentUser}
        />

        <AddMemberModal
          open={showAddMember}
          onOpenChange={setShowAddMember}
          poolId={pool._id}
          fullSeats={fullSeats}
        />

        <AssignCoSeatModal
          open={showAssignCoSeat}
          onOpenChange={setShowAssignCoSeat}
          poolId={pool._id}
          fullSeats={fullSeats}
        />

        <EditGuestModal
          open={showEditGuest}
          onOpenChange={setShowEditGuest}
          guestId={editingGuest?.id || null}
          initialName={editingGuest?.name}
          initialPhone={editingGuest?.phone}
        />

        {paymentState && (
          <PaymentModal
            open={!!paymentState}
            onOpenChange={(open) => !open && setPaymentState(null)}
            poolId={pool._id}
            seatId={paymentState.seatId}
            roundIndex={paymentState.roundIndex}
            amount={paymentState.amount}
            currency={pool.config.currency}
            paymentDetails={pool.paymentDetails}
            isOrganizer={isOrganizer}
          />
        )}

        <WinnerSelectionModal
          open={showWinnerSelection}
          onOpenChange={setShowWinnerSelection}
          eligibleSeats={eligibleDrawSeats.map(s => s.seatNumber)}
          onStartAnimation={() => {
            setShowWinnerSelection(false);
            setShowDrawAnimation(true);
          }}
          onSetManualWinner={async (seatNum: number) => {
            await handleRunDraw(seatNum);
            setShowWinnerSelection(false);
          }}
        />

        <NextRoundModal
          open={showNextRound}
          onOpenChange={setShowNextRound}
          onAdvance={handleAdvanceRound}
        />

        {showDrawAnimation && (
          <RunDrawAnimationModal
            eligibleSlots={eligibleDrawSeats}
            onRunDraw={() => handleRunDraw()}
            onClose={() => setShowDrawAnimation(false)}
            currency={pool.config.currency || "$"}
            winningAmount={pool.config.totalValue}
            currentRound={pool.currentRound}
          />
        )}

        <RecordCashModal
          open={showRecordCash}
          onOpenChange={setShowRecordCash}
          poolId={pool._id}
          roundIndex={pool.currentRound}
          seatOptions={seats.map((seat) => ({ seatId: seat._id as Id<"seats">, seatNumber: seat.seatNumber }))}
        />

        {showRecordPayout && (
          <RecordPayoutModal
            open={showRecordPayout}
            onOpenChange={setShowRecordPayout}
            poolId={pool._id}
            currentRound={pool.currentRound}
            seatOptions={payoutSeatOptions}
            defaultAmount={pool.config.totalValue}
            currency={pool.config.currency || "$"}
          />
        )}

        <DeletePoolModal
          open={showDeletePool}
          onOpenChange={setShowDeletePool}
          onConfirm={handleDeletePool}
        />

        <ArchivePoolModal
          open={showArchiveModal}
          onOpenChange={setShowArchiveModal}
          onConfirm={handleArchivePool}
        />
      </div>
    </div>
  );
}
