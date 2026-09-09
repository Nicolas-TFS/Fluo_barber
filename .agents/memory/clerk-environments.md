---
name: Clerk environments
description: Replit-managed Clerk separates development and production user stores, while app data must be scoped server-side for cross-device access.
---

Replit-managed Clerk has separate Development and Production environments. An account created in preview is not available in the published app, and vice versa. Within one environment, Clerk sessions can work across devices, but product data must be stored in a server-side database keyed by the Clerk user ID rather than only in device storage.

**Why:** Device-local storage makes a user appear unconfigured on a second device and can risk mixing data when another account signs in on the same device.

**How to apply:** Keep Clerk for identity and use authenticated API/database records scoped to the Clerk user ID for barbershop profile, services, clients, appointments, and financial data. Treat local storage as a cache or one-time migration source only.