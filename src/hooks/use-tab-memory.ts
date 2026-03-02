import { useState, useEffect } from "react";

const TAB_KEY = (route: string) => `covos:tab:${route}`;

export function useTabMemory(route: string, defaultTab: string): [string, (tab: string) => void] {
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return defaultTab;
    return localStorage.getItem(TAB_KEY(route)) ?? defaultTab;
  });

  function setTab(tab: string) {
    setActiveTab(tab);
    localStorage.setItem(TAB_KEY(route), tab);
  }

  return [activeTab, setTab];
}
