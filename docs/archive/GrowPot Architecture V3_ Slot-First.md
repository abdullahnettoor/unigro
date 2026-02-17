# **GrowPot: Chit Fund Architecture & Logic (V2)**

## **1\. Core Model: The "Slot-First" Approach**

To support multi-user ownership and fractional shares, **Slots** are the primary architectural unit.

* A Pot is defined by a fixed number of **Slots**.  
* **1 Slot \= 1 Draw.**  
* **Duration** is strictly defined as the total number of draw cycles required to exhaust all slots.

## ---

**2\. Configuration Matrix**

| Chit Type | Frequency | Member / Share Rules | Draw Strategy | Status |
| :---- | :---- | :---- | :---- | :---- |
| **Standard** | Any | 1 User : 1 Slot | Random / Manual | ✅ **Ready** |
| **Multi-Slot** | Any | 1 User : N Slots | Random / Manual | ✅ **Ready** (via Slot Logic) |
| **Fractional** | Any | N Users : 1 Slot | Random | ⚠️ **In-Dev** (Split Payout) |
| **Fixed Sequence** | Any | 1 User : 1 Slot | Pre-defined order | ✅ **Ready** |
| **Occasional** | Event-based | 1 User : 1 Slot | Manual Trigger | ✅ **Ready** |
| **Double Draw** | Any | 1 User : 1 Slot | 2 Slots per Cycle | ⏳ **Pending** |

## ---

**3\. Advanced Validation & State Logic**

### **State Transitions**

* **DRAFT:** Foreman sets parameters (Pot Value, Frequency, Commission).  
* **LOCK:** Triggered when the configuration is finalized. Invites are sent. Parameters are read-only.  
* **ACTIVE:** Only possible when **100% of Slots are filled**. Once active, the first cycle can begin.  
* **COMPLETED:** All slots have been drawn and payouts recorded.

### **Foreman First Option (FOREMAN\_FIRST)**

If enabled, the Foreman is automatically assigned **Slot 1**. This acts as the "organizer's perk" and provides initial liquidity.

### **Default & Lapse Management (Non-Auction)**

In the event of a member missing a payment, the system supports two recovery paths:

| Path | Winner Impact | Defaulter Impact |
| :---- | :---- | :---- |
| **Deducted Payout** | Winner receives: Total Pot \- Unpaid Shares. | When the defaulter finally wins, their "debt" is already settled via the previous winner's deduction. |
| **Foreman Guarantee** | Winner receives Full Pot. Foreman covers the gap. | Defaulter's Payout: Total Pot \- (Missed Payments × Installment Value). |

## ---

**4\. Draw & Eligibility Logic**

* **Primary Key:** The draw selects a Slot\_ID, not a User\_ID.  
* **One-Win Rule:** A Slot\_ID is eligible for the draw only once per Pot lifecycle.  
* **Manual Override:** Even in RANDOM strategy, the Foreman can initiate a MANUAL draw if the community agrees on a winner (e.g., medical emergency).

## ---

**5\. Implementation Examples (JSON)**

### **Standard Pot with FOREMAN\_FIRST**

JSON

{  
  "title": "Apartment Association Fund",  
  "config": {  
    "totalValue": 200000,  
    "totalSlots": 20,  
    "duration": 20,   
    "frequency": "monthly",  
    "foremanFirst": true,  
    "recoveryPath": "DEDUCTED\_PAYOUT"  
  },  
  "slotMapping": \[  
    { "slotId": 1, "userId": "foreman\_user\_id", "status": "ASSIGNED" },  
    { "slotId": 2, "userId": "user\_abc\_123", "status": "ASSIGNED" }  
  \]  
}

### **Fractional Slot Configuration**

JSON

{  
  "title": "Shared Neighborhood Kuri",  
  "config": {  
    "totalSlots": 10,  
    "duration": 10  
  },  
  "slots": \[  
    {  
      "slotId": 5,  
      "owners": \[  
        { "userId": "user\_a", "share": 0.5 },  
        { "userId": "user\_b", "share": 0.5 }  
      \]  
    }  
  \]  
}

### **High-Liquidity Double Draw**

*Logic: Duration is half the total slots because 2 slots are cleared per cycle.*

JSON

{  
  "title": "Traders Fast-Track Pot",  
  "config": {  
    "totalSlots": 30,  
    "duration": 15,   
    "payoutsPerCycle": 2,  
    "frequency": "weekly"  
  }  
}

## 

1. **Refine Slot Table:** Ensure the database schema links Slot\_ID to Payout\_Transaction\_ID.  
2. **Payout Splitter:** Create a utility function to handle the math for Fractional owners during a win.  
3. **Active Gate:** Implement the check: if (total\_slots.filled \== total\_slots.defined) { allow\_activation: true }.

