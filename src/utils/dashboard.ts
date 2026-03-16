import type { ViewState } from "@/types";

export const dashboardTabs = [
  "marketplace",
  "videos",
  "outfits",
  "hairstyles",
  "search",
  "profile",
] as const;

export type DashboardTab = (typeof dashboardTabs)[number];

export const defaultDashboardTab: DashboardTab = "marketplace";

export const isDashboardTab = (
  value: string | null | undefined
): value is DashboardTab =>
  !!value && (dashboardTabs as readonly string[]).includes(value);

export const getDashboardTab = (
  value: string | null | undefined
): DashboardTab => (isDashboardTab(value) ? value : defaultDashboardTab);

export const buildDashboardHref = (
  username: string,
  tab: DashboardTab = defaultDashboardTab
) =>
  tab === defaultDashboardTab
    ? `/${username}/dashboard`
    : `/${username}/dashboard?tab=${tab}`;

export const getDashboardTabFromView = (
  view: ViewState["view"]
): DashboardTab | null => {
  switch (view) {
    case "marketplace":
    case "videos":
    case "outfits":
    case "hairstyles":
    case "search":
    case "profile":
      return view;
    default:
      return null;
  }
};
