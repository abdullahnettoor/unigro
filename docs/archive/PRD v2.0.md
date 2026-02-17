# **Product Requirements Document (PRD): GrowPot v2.0**

**Version:** 2.1  
**Project Name:** GrowPot  
**Status:** Finalized Blueprint  
**Role:** Experienced Project Manager (with CTO Technical Inputs)

## **1\. Executive Summary**

**GrowPot** is a management platform for fixed-contribution community chit funds (ROSCA). It digitizes the "Foreman" experience while lowering the barrier to entry through a unique "Ghost Member" system. Built as a Progressive Web App (PWA), it prioritizes accessibility, offline-first reliability, and real-time updates for trust-based financial groups.

## **2\. User Roles & Identity**

### **2.1 Personas**

* **Foreman:** The creator and verifier of a Pot. Any user can become a Foreman after completing the **Verification Tier**.  
* **Member (Active/Ghost):** Participants in the pot.  
  * **Active:** Registered users who interact with the UI.  
  * **Ghost:** Unregistered participants managed by the Foreman until they sign up.

### **2.2 Authentication & Verification**

* **OAuth Integration:** Primary login via Google/Social handles, managed by **Clerk**.  
* **Mandatory Registration Fields:** \* **Phone Number:** Required at registration to facilitate the sync of historical "Ghost" data.  
  * **Profile Data:** Capture Email, Display Name, and Profile URL at signup.  
* **Verification Flow:**  
  * **Unverified:** Can participate as a member in pots created by others.  
  * **Verified:** Required to create and manage Pots.  
  * **MVP Verification Process:** User uploads a photo of Government ID (Aadhaar/PAN) \+ ID number. Phase 1 involves Admin/Manual approval.

## **3\. Functional Requirements**

### **3.1 The "Ghost Member" System**

* **Onboarding:** Foreman adds a member via Name \+ Phone Number.  
* **Storage:** A "Ghost" user record is created in the backend (Convex) linked to that phone number.  
* **Conversion (The Claim):** Since the phone number is mandatory at signup, the system immediately checks for existing Ghost records. If found, the user is prompted to "Claim" their participation and historical ledger.

### **3.2 Pot Management & Lifecycle**

* **Configuration:** Frequency (Monthly), Total Value, Contribution Amount, and Duration.  
* **Rule Locking:** Core parameters (amounts, frequency) become **Immutable** once the first payment is logged.  
* **Draw Logic (Set at Creation):**  
  1. **Initial Sequence:** Order determined and fixed at the start.  
  2. **Monthly Random:** Foreman-triggered draw each month picking from members who haven't won yet.

### **3.3 The Ledger & Financials**

* **Proof of Payment:** Members can upload screenshots of transfers (stored via Convex File Storage).  
* **Verification Loop:** Payments exist in a Pending state. The Foreman must explicitly "Verify" to move them to Paid.  
* **Foreman Commission:**  
  * **Deduction Model:** Commission subtracted from the winner's payout.  
  * **Extra Fee Model:** Members pay an additional surcharge above the contribution.

## **4\. Technical Architecture**

* **Backend:** **Convex** (leveraging real-time reactivity and mutations for financial integrity).  
* **Frontend:** **Vite \+ React (PWA)**.  
* **PWA Strategy:** \* Offline shell for instant loading.  
  * Optimistic UI updates for ledger actions to handle spotty connectivity.  
* **Contacts:** Implementation of the **Web Contact Picker API** for adding members directly from the phone’s address book (with manual fallback).

## **5\. UI/UX Requirements**

* **The "Pot View":** A circular visualization representing the participants in the current rotation, highlighting winners and the current month's "target."  
* **Dashboard:** High-priority alert-driven design (e.g., "Payment Due in 2 Days", "Verify 1 Pending Payment").  
* **Foreman Console:** Centralized view for ID verification status and pot oversight.

## **6\. Roadmap**

* **V1 (MVP):** Manual verification, Ghost member conversion, PWA Ledger, and basic draws.  
* **V2:** Automated draw animations, PWA Push Notifications for reminders.  
* **V3:** Automated KYC integration, Social Vouching scores, and CSV/PDF export for tax/transparency.

## **7\. Success Metrics**

* **Conversion Rate:** Percentage of Ghost members who register an account.  
* **Integrity:** Zero state-mismatch errors in the Convex mutations.  
* **Verification Speed:** Turnaround time for manual Foreman ID approvals.