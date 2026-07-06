import { createContext, useContext } from "react";
import { Meeting, Session, ImportProgress } from "../../types/onboardingTypes";

export interface OnboardingContextValue {
  meetings: Meeting[];
  filteredMeetings: Meeting[];
  sessions: Session[];
  selectedMeeting: Meeting | null;
  selectedSession: number | null;
  year: number;
  loadingMeetings: boolean;
  loadingSessions: boolean;
  hidePreSeason: boolean;
  hideFutureEvents: boolean;
  sessionDataExists: boolean | null;
  importProgress: ImportProgress | null;
  importing: boolean;
  setSelectedMeeting: (meeting: Meeting | null) => void;
  setSelectedSession: (sessionKey: number | null) => void;
  setYear: (year: number) => void;
  setHidePreSeason: (hide: boolean) => void;
  setHideFutureEvents: (hide: boolean) => void;
  handleImport: () => void;
  onSelectSession: (sessionKey: number) => void;
}

export const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboardingContext(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboardingContext must be used within an OnboardingProvider");
  }
  return ctx;
}
