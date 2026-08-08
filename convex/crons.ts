import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Nightly full reconciliation: re-push the whole availability + rate horizon
// so any missed incremental update self-heals within 24h.
crons.daily(
  "channex full sync",
  { hourUTC: 3, minuteUTC: 15 },
  internal.channex.pushAvailability,
  {},
);

export default crons;
