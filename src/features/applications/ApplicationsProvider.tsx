import {
  useCallback,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { ApplicationsContext } from "./applicationsContext";
import {
  changeApplicationStatus,
  createApplication,
  loadApplications,
  persistApplications,
  removeApplication,
  updateApplication,
} from "./services/applicationsService";
import { initialApplications } from "./services/mockApplications";
import type {
  ApplicationDraft,
  ApplicationStatus,
  JobApplication,
} from "./types";
import { loadSavedJobIds, persistSavedJobIds } from "@/features/job-discovery/services/savedJobsService";
import type {
  InterviewPreparation,
  InterviewPreparationDraft,
} from "@/features/interview-prep/types";
import {
  createInterviewPreparation,
  deleteInterviewPreparation as removeInterviewPreparation,
  loadInterviewPreparations,
  persistInterviewPreparations,
  updateInterviewPreparation,
} from "@/features/interview-prep/services/interviewPreparationService";

export function ApplicationsProvider({ children }: PropsWithChildren) {
  const [initialState] = useState(() => {
    let applications = initialApplications;
    let interviewPreparations: InterviewPreparation[] = [];
    let savedJobIds: string[] = [];
    const errors: string[] = [];
    try {
      applications = loadApplications();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Could not load saved applications.");
    }
    try {
      interviewPreparations = loadInterviewPreparations(applications);
    } catch (error) {
      errors.push(
        error instanceof Error
          ? error.message
          : "Could not load interview preparation.",
      );
    }
    try {
      savedJobIds = loadSavedJobIds();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Could not load your saved jobs.");
    }
    return {
      applications,
      interviewPreparations,
      savedJobIds,
      error: errors.length ? errors.join(" ") : null,
    };
  });
  const [applications, setApplications] = useState(initialState.applications);
  const [interviewPreparations, setInterviewPreparations] = useState(
    initialState.interviewPreparations,
  );
  const [savedJobIds, setSavedJobIds] = useState(initialState.savedJobIds);
  const [error, setError] = useState<string | null>(initialState.error);

  const commit = useCallback((next: JobApplication[]) => {
    try {
      persistApplications(next);
      setApplications(next);
      setError(null);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your changes.");
      return false;
    }
  }, []);

  const addApplication = useCallback(
    (draft: ApplicationDraft) => {
      try {
        return commit(createApplication(applications, draft));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not add this application.");
        return false;
      }
    },
    [applications, commit],
  );

  const editApplication = useCallback(
    (id: string, draft: ApplicationDraft) => {
      try {
        return commit(updateApplication(applications, id, draft));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update this application.");
        return false;
      }
    },
    [applications, commit],
  );

  const deleteApplication = useCallback(
    (id: string) => {
      try {
        const nextApplications = removeApplication(applications, id);
        const nextPreparations = interviewPreparations.filter(
          (preparation) => preparation.applicationId !== id,
        );
        persistApplications(nextApplications);
        try {
          persistInterviewPreparations(nextPreparations);
        } catch (error) {
          persistApplications(applications);
          throw error;
        }
        setApplications(nextApplications);
        setInterviewPreparations(nextPreparations);
        setError(null);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not delete this application.");
        return false;
      }
    },
    [applications, interviewPreparations],
  );

  const moveApplication = useCallback(
    (id: string, status: ApplicationStatus) => {
      try {
        commit(changeApplicationStatus(applications, id, status));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not move this application.");
      }
    },
    [applications, commit],
  );

  const toggleSavedJob = useCallback(
    (jobId: string) => {
      const next = savedJobIds.includes(jobId)
        ? savedJobIds.filter((savedId) => savedId !== jobId)
        : [jobId, ...savedJobIds];
      try {
        persistSavedJobIds(next);
        setSavedJobIds(next);
        setError(null);
        return true;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update your saved jobs.");
        return false;
      }
    },
    [savedJobIds],
  );

  const addJobToTracker = useCallback(
    (jobId: string, draft: ApplicationDraft) => {
      const existing = applications.find((application) => application.sourceJobId === jobId);
      if (existing) return true;
      return addApplication({ ...draft, sourceJobId: jobId });
    },
    [applications, addApplication],
  );

  const saveInterviewPreparation = useCallback(
    (
      nextPreparations: InterviewPreparation[],
      preparation: InterviewPreparation,
    ) => {
      const application = applications.find(
        (item) => item.id === preparation.applicationId,
      );
      if (!application) {
        setError("Choose an existing application before saving interview preparation.");
        return false;
      }

      const linkedInterviews = nextPreparations
        .filter((item) => item.applicationId === preparation.applicationId)
        .sort(
          (first, second) =>
            Date.parse(first.scheduledAt) - Date.parse(second.scheduledAt),
        );
      const applicationInterview =
        linkedInterviews.find(
          (item) =>
            item.outcome === "upcoming" &&
            Date.parse(item.scheduledAt) >= Date.now(),
        ) ?? linkedInterviews.at(-1) ?? preparation;
      const scheduledDate = new Date(applicationInterview.scheduledAt);
      if (Number.isNaN(scheduledDate.getTime())) {
        setError("Enter a valid interview date and time.");
        return false;
      }

      const nextApplications = updateApplication(applications, application.id, {
        ...application,
        interviewAt: scheduledDate.toISOString(),
        interviewType: applicationInterview.interviewType,
      });

      try {
        persistApplications(nextApplications);
        try {
          persistInterviewPreparations(nextPreparations);
        } catch (error) {
          persistApplications(applications);
          throw error;
        }
        setApplications(nextApplications);
        setInterviewPreparations(nextPreparations);
        setError(null);
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not save interview preparation.",
        );
        return false;
      }
    },
    [applications],
  );

  const addInterviewPreparation = useCallback(
    (draft: InterviewPreparationDraft) => {
      try {
        const normalizedDraft = {
          ...draft,
          scheduledAt: new Date(draft.scheduledAt).toISOString(),
        };
        const nextPreparations = createInterviewPreparation(
          interviewPreparations,
          normalizedDraft,
        );
        const preparation = nextPreparations[0];
        return saveInterviewPreparation(nextPreparations, preparation)
          ? preparation.id
          : null;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not create interview preparation.",
        );
        return null;
      }
    },
    [interviewPreparations, saveInterviewPreparation],
  );

  const editInterviewPrep = useCallback(
    (id: string, draft: InterviewPreparationDraft) => {
      try {
        const normalizedDraft = {
          ...draft,
          scheduledAt: new Date(draft.scheduledAt).toISOString(),
        };
        const nextPreparations = updateInterviewPreparation(
          interviewPreparations,
          id,
          normalizedDraft,
        );
        const preparation = nextPreparations.find((item) => item.id === id);
        if (!preparation) {
          throw new Error("This interview preparation record no longer exists.");
        }
        return saveInterviewPreparation(nextPreparations, preparation);
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not update interview preparation.",
        );
        return false;
      }
    },
    [interviewPreparations, saveInterviewPreparation],
  );

  const deleteInterviewPrep = useCallback(
    (id: string) => {
      const preparation = interviewPreparations.find((item) => item.id === id);
      if (!preparation) {
        setError("This interview preparation record no longer exists.");
        return false;
      }
      const application = applications.find(
        (item) => item.id === preparation.applicationId,
      );
      if (!application) {
        setError("The linked application no longer exists.");
        return false;
      }
      try {
        const nextPreparations = removeInterviewPreparation(
          interviewPreparations,
          id,
        );
        const remainingInterviews = nextPreparations
          .filter((item) => item.applicationId === application.id)
          .sort(
            (first, second) =>
              Date.parse(first.scheduledAt) - Date.parse(second.scheduledAt),
          );
        const remainingInterview =
          remainingInterviews.find(
            (item) =>
              item.outcome === "upcoming" &&
              Date.parse(item.scheduledAt) >= Date.now(),
          ) ?? remainingInterviews.at(-1);
        const nextApplications = updateApplication(applications, application.id, {
          ...application,
          interviewAt: remainingInterview?.scheduledAt,
          interviewType: remainingInterview?.interviewType,
        });
        persistApplications(nextApplications);
        try {
          persistInterviewPreparations(nextPreparations);
        } catch (error) {
          persistApplications(applications);
          throw error;
        }
        setApplications(nextApplications);
        setInterviewPreparations(nextPreparations);
        setError(null);
        return true;
      } catch (caught) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Could not delete interview preparation.",
        );
        return false;
      }
    },
    [applications, interviewPreparations],
  );

  const dismissError = useCallback(() => setError(null), []);
  const value = useMemo(
    () => ({
      applications,
      interviewPreparations,
      savedJobIds,
      error,
      addApplication,
      editApplication,
      deleteApplication,
      moveApplication,
      toggleSavedJob,
      addJobToTracker,
      addInterviewPreparation,
      editInterviewPreparation: editInterviewPrep,
      deleteInterviewPreparation: deleteInterviewPrep,
      dismissError,
    }),
    [
      applications,
      interviewPreparations,
      savedJobIds,
      error,
      addApplication,
      editApplication,
      deleteApplication,
      moveApplication,
      toggleSavedJob,
      addJobToTracker,
      addInterviewPreparation,
      editInterviewPrep,
      deleteInterviewPrep,
      dismissError,
    ],
  );

  return (
    <ApplicationsContext.Provider value={value}>
      {children}
    </ApplicationsContext.Provider>
  );
}
