import { createContext, useContext } from "react";

/** Internal presentation scope; native controls retain their desktop sizing. */
export const MobileTarget = createContext(false);

export function useMobileTarget() {
  return useContext(MobileTarget)
    ? { minWidth: 44, minHeight: 44, flexShrink: 0 }
    : undefined;
}
