export const UserRole = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const BudgetLevel = {
  BUDGET: "budget",
  MID_RANGE: "mid_range",
  PREMIUM: "premium",
  LUXURY: "luxury",
} as const;
export type BudgetLevel = (typeof BudgetLevel)[keyof typeof BudgetLevel];

export const TravelStyle = {
  RELAXATION: "relaxation",
  ADVENTURE: "adventure",
  CULTURE: "culture",
  FOOD: "food",
  NATURE: "nature",
  SHOPPING: "shopping",
  NIGHTLIFE: "nightlife",
  FAMILY: "family",
  BUSINESS: "business",
  SPORTS: "sports",
} as const;
export type TravelStyle = (typeof TravelStyle)[keyof typeof TravelStyle];

export const PreferredPace = {
  RELAXED: "relaxed",
  BALANCED: "balanced",
  PACKED: "packed",
} as const;
export type PreferredPace = (typeof PreferredPace)[keyof typeof PreferredPace];

export const TripStatus = {
  DRAFT: "draft",
  PLANNING: "planning",
  CONFIRMED: "confirmed",
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];

export const TripVisibility = {
  PRIVATE: "private",
  LINK_ONLY: "link_only",
  PUBLIC: "public",
} as const;
export type TripVisibility = (typeof TripVisibility)[keyof typeof TripVisibility];

export const TripMemberRole = {
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;
export type TripMemberRole = (typeof TripMemberRole)[keyof typeof TripMemberRole];

export const TripMemberStatus = {
  INVITED: "invited",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  REMOVED: "removed",
} as const;
export type TripMemberStatus = (typeof TripMemberStatus)[keyof typeof TripMemberStatus];

export const TransportMode = {
  FLIGHT: "flight",
  TRAIN: "train",
  BUS: "bus",
  CAR: "car",
  TAXI: "taxi",
  WALK: "walk",
  BIKE: "bike",
  OTHER: "other",
} as const;
export type TransportMode = (typeof TransportMode)[keyof typeof TransportMode];

export const TripActivityStatus = {
  PLANNED: "planned",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  CANCELLED: "cancelled",
} as const;
export type TripActivityStatus = (typeof TripActivityStatus)[keyof typeof TripActivityStatus];

export const ExpenseCategory = {
  TRANSPORT: "transport",
  ACCOMMODATION: "accommodation",
  FOOD: "food",
  ACTIVITY: "activity",
  SHOPPING: "shopping",
  VISA: "visa",
  INSURANCE: "insurance",
  OTHER: "other",
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];

export const TripShareAccessType = {
  PUBLIC: "public",
  LINK_ONLY: "link_only",
  PRIVATE: "private",
} as const;
export type TripShareAccessType = (typeof TripShareAccessType)[keyof typeof TripShareAccessType];

export const TripInvitationRole = {
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;
export type TripInvitationRole = (typeof TripInvitationRole)[keyof typeof TripInvitationRole];

export const TripInvitationStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
  EXPIRED: "expired",
} as const;
export type TripInvitationStatus = (typeof TripInvitationStatus)[keyof typeof TripInvitationStatus];

export const CommunityPostVisibility = {
  PUBLIC: "public",
  FOLLOWERS: "followers",
  PRIVATE: "private",
} as const;
export type CommunityPostVisibility = (typeof CommunityPostVisibility)[keyof typeof CommunityPostVisibility];

export const CommunityPostStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  ARCHIVED: "archived",
} as const;
export type CommunityPostStatus = (typeof CommunityPostStatus)[keyof typeof CommunityPostStatus];
