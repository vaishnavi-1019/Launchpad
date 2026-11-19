import { useContext } from "react";
import { ApplicationsContext } from "../applicationsContext";

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (!context) {
    throw new Error("useApplications must be used within ApplicationsProvider.");
  }
  return context;
}
