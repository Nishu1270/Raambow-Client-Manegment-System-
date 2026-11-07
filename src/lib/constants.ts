export const CLIENT_STATUSES = [
  {
    id: "NEW",
    label: "New",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    badge: "border-blue-300 text-blue-800 bg-blue-50/80",
    description: "Newly acquired lead, not yet contacted",
  },
  {
    id: "INTERESTED",
    label: "Interested",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    badge: "border-emerald-300 text-emerald-800 bg-emerald-50/80",
    description: "Positive response, actively discussing requirement",
  },
  {
    id: "FOLLOW_UP",
    label: "Follow-up",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
    badge: "border-amber-300 text-amber-800 bg-amber-50/80",
    description: "Pending callback or meeting scheduled",
  },
  {
    id: "FUTURE",
    label: "Future",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
    badge: "border-purple-300 text-purple-800 bg-purple-50/80",
    description: "Wants service later (e.g., next month, next quarter)",
  },
  {
    id: "THINKING",
    label: "Thinking",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
    badge: "border-indigo-300 text-indigo-800 bg-indigo-50/80",
    description: "Evaluating quotation, comparing options",
  },
  {
    id: "NOT_INTERESTED",
    label: "Not Interested",
    color: "bg-slate-100 text-slate-700 border-slate-300",
    dot: "bg-slate-500",
    badge: "border-slate-300 text-slate-700 bg-slate-50",
    description: "Declined service or already hired someone else",
  },
  {
    id: "NO_RESPONSE",
    label: "No Response",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
    badge: "border-orange-300 text-orange-800 bg-orange-50/80",
    description: "Unanswered call, busy, or unreachable",
  },
  {
    id: "CONVERTED",
    label: "Converted",
    color: "bg-green-100 text-green-800 border-green-300",
    dot: "bg-green-600",
    badge: "border-green-400 text-green-900 bg-green-100/90 font-semibold",
    description: "Won client! Deal closed & advance received",
  },
  {
    id: "LOST",
    label: "Lost",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
    badge: "border-rose-300 text-rose-800 bg-rose-50",
    description: "Went with competitor or project cancelled",
  },
] as const;

export type ClientStatusType = (typeof CLIENT_STATUSES)[number]["id"];

export const CALL_RESULTS = [
  { id: "CONNECTED", label: "Connected", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "NO_RESPONSE", label: "No Response", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "BUSY", label: "Busy", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { id: "CALL_LATER", label: "Call Later", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "WRONG_NUMBER", label: "Wrong Number", color: "bg-slate-100 text-slate-600 border-slate-200" },
  { id: "MEETING_SCHEDULED", label: "Meeting Scheduled", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { id: "OTHER", label: "Other", color: "bg-gray-100 text-gray-700 border-gray-200" },
] as const;

export type CallResultType = (typeof CALL_RESULTS)[number]["id"];

export const USER_ROLES = [
  { id: "ADMIN", label: "Administrator" },
  { id: "TEAM_MEMBER", label: "Team Member" },
] as const;

