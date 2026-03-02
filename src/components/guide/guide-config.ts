export type TriggerType = "idle_60s" | "repeated_visit_no_action" | "empty_state" | "first_visit";

export type GuideTip = {
  trigger: TriggerType;
  message: string;
  primaryAction?: string;
};

export type GuidePageConfig = {
  tips: GuideTip[];
  primaryActionSelector?: string;
};

export const GUIDE_CONFIG: Record<string, GuidePageConfig> = {
  "/leads": {
    primaryActionSelector: "[data-guide-action='lead-contacted']",
    tips: [
      {
        trigger: "first_visit",
        message:
          "Welcome to the Sales Pipeline. Your leads are ranked by Impact Score — work top-to-bottom, not alphabetically.",
      },
      {
        trigger: "idle_60s",
        message:
          "Still deciding? Filter by Tier A and sort by Impact Score. Your highest-value leads aren't going to call themselves.",
      },
      {
        trigger: "repeated_visit_no_action",
        message:
          "You've been here three times without contacting anyone. That lead isn't going to close itself.",
      },
    ],
  },
  "/clients": {
    tips: [
      {
        trigger: "first_visit",
        message:
          "Your clients are sorted by health score. Red means a scan found something worth your attention.",
      },
      {
        trigger: "idle_60s",
        message:
          "Staring at the client list won't improve their health scores. Pick one and take a look inside.",
      },
    ],
  },
  "/analytics": {
    tips: [
      {
        trigger: "first_visit",
        message: "This is where your decisions should start. Check the trends before the inbox.",
      },
      {
        trigger: "idle_60s",
        message:
          "The chart is telling you something. Most people ignore it until it's too late.",
      },
    ],
  },
  "/settings": {
    tips: [
      {
        trigger: "first_visit",
        message:
          "Settings. Where people go when something is wrong and they're not sure what.",
      },
      {
        trigger: "idle_60s",
        message:
          "Still in settings? At some point you have to commit to a configuration and move on.",
      },
    ],
  },
  "/vault": {
    tips: [
      {
        trigger: "first_visit",
        message:
          "Document Vault. Everything your clients need to sign or review lives here. Or should.",
      },
      {
        trigger: "idle_60s",
        message: "Files don't send themselves. Find what you're looking for and act on it.",
      },
    ],
  },
  "/tasks": {
    tips: [
      {
        trigger: "first_visit",
        message:
          "Task queue. Prioritised automatically. Start at the top, work down. That's the whole system.",
      },
      {
        trigger: "idle_60s",
        message:
          "The task isn't going to complete itself. You being here doesn't count as progress.",
      },
      {
        trigger: "repeated_visit_no_action",
        message:
          "This is the third time you've been here without doing anything. Consider delegating or committing.",
      },
    ],
  },
  "__first_visit__": {
    tips: [
      {
        trigger: "first_visit",
        message:
          "First time here. Don't worry — it gets worse before it gets better. But mostly better.",
      },
    ],
  },
  "__empty_state__": {
    tips: [
      {
        trigger: "empty_state",
        message:
          "Nothing here yet. That's either a fresh start or a problem, depending on how long the dashboard has been running.",
      },
    ],
  },
};
