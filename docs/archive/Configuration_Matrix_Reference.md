# Chit Fund Configurations & Validation Logic

## Configuration Matrix

This table outlines the various Chit Fund (Pot) models supported by the GrowPot platform, categorized by their implementation status.

| Chit Type | Frequency | Duration Logic | Member / Share Rules | Draw Strategy | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Standard Monthly** | Monthly | Fixed (e.g. 20 Months) | 1 Slot per Member | Random, Manual | ✅ **Ready** |
| **Weekly / Bi-Weekly** | Weekly, Bi-Weekly | Fixed | 1 Slot per Member | Random, Manual | ✅ **Ready** |
| **Occasional (Event)** | Occasional | Dynamic (1 Cycle per Member) | 1 Slot per Member | Manual | ✅ **Ready** (Sprint 10) |
| **Fixed Sequence** | Any | Fixed | 1 Slot per Member | Fixed Sequence | ✅ **Ready** (Sprint 8) |
| **Multi-Slot User** | Any | Fixed | One User can hold multiple Slots | Random | ⚠️ **Partial** (Schema supported, UI needs polish) |
| **Fractional Share** | Any | Fixed | Share < 1.0 (e.g. 0.5) | Random | ⏳ **Pending** (Payout logic needed) |
| **Double Draw** | Any | Fixed / 2 | 2 Winners per Cycle | Random x 2 | ⏳ **Pending** (Needs multi-winner logic) |
| **Auction / Bidding** | Monthly | Fixed | 1 Slot per Member | Bid Winner (Lowest Bid) | ⏳ **Not Needed** (Future Phase) |

---

## Validation Logic

The platform enforces the following constraints to ensure mathematical integrity and fairness.

### 1. Pot Creation & Activation
-   **Minimum Members:** Technically 2, but practically matches `Duration` for fairness in standard pots.
-   **Duration Constraint:**
    -   *Standard:* `Duration` must be specified by Foreman.
    -   *Occasional:* `Duration` is **automatically set** to the number of Members when the pot starts.
-   **Status Transitions:**
    -   `DRAFT` -> `ACTIVE`: Only allowed if config is valid. Config is locked after activation.
    -   `ACTIVE` -> `COMPLETED`: Automatically transitions when `currentMonth >= duration`.
    -   `COMPLETED` -> `ARCHIVED`: Manually triggered by Foreman, gated by payout checks.

### 2. Draw Mechanics
-   **Eligibility:** A member is eligible to win **only if** they have not won in a previous cycle of this pot.
-   **Sequence Integrity:** For `FIXED` strategy, the system validates that a member exists with `sequence == currentCycle`. If not, it requests Manual Override.
-   **Occasional Cycle:** The cycle does not advance automatically by time. It advances only when the Foreman explicitly clicks "Start Next Round".

### 3. Financials
-   **Contribution:** `Total Pot Value / Duration` (or defined explicitly).
-   **Payout:** `Total Pot Value - Commission` (if commission is set).
-   **Commission:** Calculated as a percentage of the Total Pot Value, deducted from the specific winner's payout.

---

## Configuration Examples (JSON)

Use these configurations to test or initialize different pot types.

### 1. Standard Monthly (Ready)
```json
{
  "title": "Family Savings 2026",
  "config": {
    "totalValue": 100000,
    "contribution": 5000,
    "frequency": "monthly",
    "duration": 20,
    "commission": 0,
    "gracePeriodDays": 5
  },
  "drawStrategy": "RANDOM"
}
```

### 2. Market Weekly (Ready)
```json
{
  "title": "Market Merchants Weekly",
  "config": {
    "totalValue": 30000,
    "contribution": 2000,
    "frequency": "weekly",
    "duration": 15,
    "commission": 0
  },
  "drawStrategy": "FIXED"
}
```

### 3. Occasional / Event Pot (Ready)
*Note: Duration is ignored during creation and set to Member Count on activation.*
```json
{
  "title": "Cousins Wedding Fund",
  "config": {
    "totalValue": 50000,
    "contribution": 5000,
    "frequency": "occasional",
    "duration": 0,
    "startDate": 1727740800000
  },
  "drawStrategy": "MANUAL"
}
```

### 4. High-Liquidity "Double Draw" (Pending)
*Requires backend support for multiple winners per cycle.*
```json
{
  "title": "Office Tech Group",
  "config": {
    "totalValue": 400000,
    "frequency": "monthly",
    "duration": 20
  },
  "custom_logic": {
    "winners_per_cycle": 2,
    "slots": 40
  }
}
```

### 5. Fractional Share Kuri (Pending)
*Requires payout splitting logic.*
```json
{
  "title": "Neighborhood Welfare",
  "members": [
    {"userId": "u1", "share": 0.5},
    {"userId": "u2", "share": 0.5},
    {"userId": "u3", "share": 1.0}
  ]
}
```
