# **Chit Fund (ROSCA) Implementation Configurations**

This document outlines various non-auction (fixed-payout) chit fund models used in Indian community and professional contexts. Use these JSON structures to initialize or validate chit fund configurations.

## ---

**1\. The Standard Monthly Committee**

**Best for:** Small circles of friends, family, and simple peer-to-peer savings.

JSON

{  
  "chit\_name": "Family Savings 2026",  
  "type": "Non-Auction (Lottery)",  
  "total\_members": 20,  
  "slots\_per\_member": 1,  
  "total\_slots": 20,  
  "payouts\_per\_period": 1,  
  "frequency": "Monthly",  
  "installment\_per\_slot": 5000,  
  "total\_pot\_value": 100000,  
  "duration\_months": 20,  
  "foreman\_commission\_percentage": 0,  
  "selection\_method": "Random Draw"  
}

## ---

**2\. The High-Liquidity "Double Draw"**

**Best for:** Large groups (e.g., corporate teams) who want to keep the duration short while maintaining a high member count.

JSON

{  
  "chit\_name": "Office Tech Group",  
  "type": "Non-Auction (Lottery)",  
  "total\_members": 40,  
  "slots\_per\_member": 1,  
  "total\_slots": 40,  
  "payouts\_per\_period": 2,   
  "frequency": "Monthly",  
  "installment\_per\_slot": 10000,  
  "total\_pot\_value": 400000,   
  "individual\_prize\_money": 200000,  
  "duration\_months": 20,  
  "selection\_method": "Two names drawn per month"  
}

## ---

**3\. The Market Trader's Weekly**

**Best for:** Small business owners or vendors needing rapid cash turnover for inventory and daily operations.

JSON

{  
  "chit\_name": "Market Merchants Weekly",  
  "type": "Non-Auction (Fixed Rotation)",  
  "total\_members": 15,  
  "slots\_per\_member": 1,  
  "total\_slots": 15,  
  "payouts\_per\_period": 1,  
  "frequency": "Weekly",  
  "installment\_per\_slot": 2000,  
  "total\_pot\_value": 30000,  
  "duration\_weeks": 15,  
  "selection\_method": "Pre-decided seniority/sequence list"  
}

## ---

**4\. The Multi-Share Investment (Professional)**

**Best for:** Individuals with higher disposable income aiming for multiple lump-sum payouts for long-term projects like construction.

JSON

{  
  "chit\_name": "Home Construction Fund",  
  "type": "Non-Auction",  
  "total\_members": 5,  
  "slots\_per\_member": 4,   
  "total\_slots": 20,  
  "payouts\_per\_period": 1,  
  "frequency": "Monthly",  
  "installment\_per\_slot": 10000,  
  "total\_monthly\_contribution\_per\_member": 40000,  
  "total\_pot\_value": 200000,  
  "duration\_months": 20,  
  "selection\_method": "Random Draw"  
}

## ---

**5\. The "Half-Ticket" Neighborhood Kuri**

**Best for:** Inclusive community groups where members can split a single slot's cost and share the prize money.

JSON

{  
  "chit\_name": "Neighborhood Welfare Kuri",  
  "type": "Non-Auction",  
  "total\_slots": 10,  
  "member\_mapping": \[  
    {"member\_id": "M1", "share": 1.0},  
    {"member\_id": "M2", "share": 1.0},  
    {"member\_id": "M3", "share": 0.5},  
    {"member\_id": "M4", "share": 0.5},  
    {"comment": "And so on until total shares \= 10"}  
  \],  
  "frequency": "Monthly",  
  "installment\_full\_slot": 5000,  
  "total\_pot\_value": 50000,  
  "duration\_months": 10,  
  "selection\_method": "Random Draw (per slot)"  
}

## ---

**Core Validation Logic**

When processing these configurations, the system must adhere to the following mathematical constraints:

1. **Duration Rule:** \* $Duration \= \\frac{Total\\\_Slots}{Payouts\\\_Per\\\_Period}$  
2. **Collection Rule:** \* $Total\\\_Pot \= Total\\\_Slots \\times Installment\\\_Per\\\_Slot$  
3. **Member Constraint:** \* $\\sum Shares\\\_Held\\\_By\\\_Members \= Total\\\_Slots$  
4. **Prize Distribution:**  
   * $Individual\\\_Prize \= \\frac{Total\\\_Pot}{Payouts\\\_Per\\\_Period}$ (minus foreman commission if applicable).   
   * Or Extra fee for foreman if it’s not substracted

