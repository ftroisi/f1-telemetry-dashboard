import { createContext, useContext, ReactNode, useState, useCallback } from "react";

interface LayoutContextValue {
  rightContent: ReactNode;
  setRightContent: (content: ReactNode) => void;
}

const LayoutContext = createContext<LayoutContextValue>({
  rightContent: null,
  setRightContent: () => {}
});

export function useLayoutContext() {
  return useContext(LayoutContext);
}

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [rightContent, setRightContent] = useState<ReactNode>(null);

  const setContent = useCallback((content: ReactNode) => {
    setRightContent(content);
  }, []);

  return (
    <LayoutContext.Provider value={{ rightContent, setRightContent: setContent }}>
      {children}
    </LayoutContext.Provider>
  );
}
