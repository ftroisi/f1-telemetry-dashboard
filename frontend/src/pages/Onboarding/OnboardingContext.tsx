import { createContext, useContext } from "react";
import { Meeting, Session, ImportProgress } from "../../types/onboardingTypes";

export interface OnboardingContextValue {
  meetings: Meeting[];
  sessions: Session[];
  selectedMeeting: Meeting | null;
  selectedSession: number | null;
  year: number;
  loadingMeetings: boolean;
  loadingSessions: boolean;
  importProgress: ImportProgress | null;
  importing: boolean;
  setSelectedMeeting: (meeting: Meeting | null) => void;
  setSelectedSession: (sessionKey: number | null) => void;
  setYear: (year: number) => void;
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
