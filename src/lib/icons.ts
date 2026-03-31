/**
 * UniGro Icon Registry
 * Central source of truth for all domain icons.
 * Import icons from here — change once, updates everywhere.
 */

import {
    ArrowRight,
    BadgeCheck,
    Bell,
    Building2,
    CalendarClock,
    CalendarDays,
    Camera,
    Check,
    ChevronDown,
    ChevronRight,
    CircleDollarSign,
    Clock,
    Coins,
    Copy,
    CreditCard,
    Download,
    Edit2,
    Filter,
    Flame,
    Hash,
    History,
    Image,
    Info,
    Layers,
    LayoutDashboard,
    Loader2,
    Lock,
    LogIn,
    Menu,
    Percent,
    Phone,
    Plus,
    Receipt,
    Search,
    Settings,
    Share2,
    ShieldAlert,
    Shuffle,
    SlidersHorizontal,
    Ticket,
    TrendingUp,
    Trophy,
    Trash2,
    UserPlus,
    Users,
    Wallet,
    WalletCards,
    X,
    Zap,
} from "lucide-react";

// ─── Navigation ───────────────────────────────────────────────────────────────
export const NavHomeIcon = LayoutDashboard;   // Bottom nav / rail: Home
export const NavPoolsIcon = WalletCards;      // Bottom nav / rail: Pools
export const NavSettingsIcon = Settings;      // Bottom nav / rail: Settings
export const NavAdminIcon = ShieldAlert;      // Admin only nav item
export const NavMenuIcon = Menu;              // Mobile hamburger (if ever needed)

// ─── Domain — Pool ────────────────────────────────────────────────────────────
export const PoolIcon = Coins;               // A savings pool (used everywhere)
export const ActivePoolIcon = Flame;         // Active / running pool indicator
export const DraftIcon = Lock;               // Draft / unpublished pool
export const CompletedIcon = Trophy;         // Completed pool
export const SeatIcon = Ticket;              // A seat in a pool
export const SeatCountIcon = Users;          // Seat count / member group
export const OrganizerIcon = BadgeCheck;     // Pool organizer badge
export const DrawIcon = Shuffle;             // Lottery draw mechanic
export const WinnerIcon = Trophy;            // Draw winner
export const RoundIcon = CalendarClock;      // A round / cycle in the pool

// ─── Domain — Finance ─────────────────────────────────────────────────────────
export const ContributionIcon = CircleDollarSign; // Monthly contribution amount
export const TotalValueIcon = Wallet;             // Total pool value
export const TransactionIcon = CreditCard;        // A payment / transaction record
export const ReceiptIcon = Receipt;               // Payment receipt / history
export const CommissionIcon = Percent;            // Organizer commission %
export const BankIcon = Building2;                // Bank / payment account details

// ─── Domain — Member / Seat ───────────────────────────────────────────────────
export const SeatNumberIcon = Hash;          // Seat number label (#1, #2 …)
export const JoinIcon = LogIn;               // Join a pool
export const InviteIcon = UserPlus;          // Invite a new member
export const ShareIcon = Share2;             // Share pool invite link
export const PhoneIcon = Phone;              // Member / Organizer contact

// ─── Domain — Proof / Media ───────────────────────────────────────────────────
export const UploadImageIcon = Image;        // Upload payment proof (gallery)
export const CameraIcon = Camera;            // Capture payment proof (camera)

// ─── Status & State ───────────────────────────────────────────────────────────
export const LoadingIcon = Loader2;          // Spinner / loading state
export const TrendIcon = TrendingUp;         // Growth / progress indicator
export const CheckIcon = Check;              // Confirmed / success checkmark
export const InfoIcon = Info;               // Informational tooltip / hint
export const BellIcon = Bell;               // Notification / alert
export const HistoryIcon = History;          // Historical / past data view
export const ShieldCheckIcon = BadgeCheck;   // Success / verified shield

// ─── Actions ─────────────────────────────────────────────────────────────────
export const CreateIcon = Plus;              // Create a new item
export const EditIcon = Edit2;               // Edit / update details
export const DeleteIcon = Trash2;            // Delete / archive (destructive)
export const CopyIcon = Copy;               // Copy invite code / text
export const DownloadIcon = Download;        // Export / download PDF
export const SearchIcon = Search;           // Search in lists
export const FilterIcon = Filter;           // Filter results
export const SortIcon = SlidersHorizontal;  // Sort / sort options
export const StartDateIcon = CalendarDays;  // Pool start date picker
export const CloseIcon = X;                 // Dismiss / close a sheet or modal

// ─── Navigation helpers ───────────────────────────────────────────────────────
export const DetailIcon = ChevronRight;     // Navigate to detail page
export const ExpandIcon = ChevronDown;      // Expand accordion / section
export const ArrowIcon = ArrowRight;        // Directional arrow (CTA)

// ─── Misc / Decorative ───────────────────────────────────────────────────────
export const CoinsIcon = Coins;             // Inline coins (alias of PoolIcon)
export const LayersIcon = Layers;           // Stacked / multi-level items
export const ZapIcon = Zap;                // Quick action emphasis
export const ClockIcon = Clock;            // Time / deadline related
export const LockIcon = Lock;              // Restricted / locked items
