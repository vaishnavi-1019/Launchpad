import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  FileText,
  Lightbulb,
  MapPin,
  MessageCircleQuestion,
  Plus,
  Save,
  Sparkles,
  Target,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApplications } from "@/features/applications/hooks/useApplications";
import type { JobApplication } from "@/features/applications/types";
import { useModalFocus } from "@/hooks/useModalFocus";
import { makeEmptyInterviewDraft } from "../services/interviewPreparationService";
import type {
  InterviewOutcome,
  InterviewPreparation,
  InterviewPreparationDraft,
  InterviewReminder,
  StarStory,
} from "../types";

type PrepTab = "overview" | "research" | "questions" | "star" | "notes";
type ListMode = "upcoming" | "past";

const TABS: { id: PrepTab; label: string; icon: typeof CalendarDays }[] = [
  { id: "overview", label: "Overview", icon: BookOpenCheck },
  { id: "research", label: "Company & role", icon: BriefcaseBusiness },
  { id: "questions", label: "Questions", icon: MessageCircleQuestion },
  { id: "star", label: "STAR stories", icon: Target },
  { id: "notes", label: "Notes & outcome", icon: FileText },
];

const OUTCOME_OPTIONS: { value: InterviewOutcome; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "advanced", label: "Moved forward" },
  { value: "offer", label: "Offer received" },
  { value: "rejected", label: "Not selected" },
  { value: "withdrew", label: "Withdrew" },
];

const REMINDER_OPTIONS: { value: InterviewReminder; label: string }[] = [
  { value: "none", label: "No reminder" },
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

function localDateTimeValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function formatInterviewDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return date.toLocaleString("en-US", options ?? {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function reminderLabel(reminder: InterviewReminder) {
  return REMINDER_OPTIONS.find((option) => option.value === reminder)?.label ?? "No reminder";
}

function createStoryId() {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getApplication(
  applications: JobApplication[],
  preparation: InterviewPreparation,
) {
  return applications.find((application) => application.id === preparation.applicationId);
}

function isUpcoming(preparation: InterviewPreparation) {
  return preparation.outcome === "upcoming" &&
    Date.parse(preparation.scheduledAt) >= Date.now();
}

function toDraft(preparation: InterviewPreparation): InterviewPreparationDraft {
  return {
    ...preparation,
    scheduledAt: localDateTimeValue(preparation.scheduledAt),
    checklist: preparation.checklist.map((item) => ({ ...item })),
    interviewerQuestions: [...preparation.interviewerQuestions],
    technicalQuestions: [...preparation.technicalQuestions],
    behavioralQuestions: [...preparation.behavioralQuestions],
    starStories: preparation.starStories.map((story) => ({ ...story })),
  };
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="prep-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function PrepTextarea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      value={value}
    />
  );
}

function QuestionListEditor({
  title,
  description,
  values,
  placeholder,
  onChange,
}: {
  title: string;
  description: string;
  values: string[];
  placeholder: string;
  onChange: (values: string[]) => void;
}) {
  return (
    <section className="prep-editor-section">
      <div className="prep-section-heading">
        <div><h3>{title}</h3><p>{description}</p></div>
        <span className="prep-count">{values.filter((value) => value.trim()).length}</span>
      </div>
      <FormField label="One question per line" hint="Add, edit, or remove questions as your preparation evolves.">
        <PrepTextarea
          onChange={(text) => onChange(text.split("\n"))}
          placeholder={placeholder}
          rows={Math.max(4, Math.min(9, values.length + 2))}
          value={values.join("\n")}
        />
      </FormField>
    </section>
  );
}

function InterviewCreateDialog({
  applications,
  onClose,
  onCreate,
}: {
  applications: JobApplication[];
  onClose: () => void;
  onCreate: (draft: InterviewPreparationDraft) => void;
}) {
  const dialogRef = useModalFocus<HTMLElement>();
  const [applicationId, setApplicationId] = useState(applications[0]?.id ?? "");
  const selectedApplication = applications.find((item) => item.id === applicationId);
  const [scheduledAt, setScheduledAt] = useState(() =>
    localDateTimeValue(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
  );
  const [interviewType, setInterviewType] = useState("Video interview");
  const [reminder, setReminder] = useState<InterviewReminder>("30");
  const [validationMessage, setValidationMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedApplication) {
      setValidationMessage("Choose the application this interview is for.");
      return;
    }
    if (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime())) {
      setValidationMessage("Add a valid date and time for this interview.");
      return;
    }
    onCreate({
      ...makeEmptyInterviewDraft(selectedApplication),
      scheduledAt,
      interviewType: interviewType.trim() || "Interview",
      reminder,
    });
  }

  return (
    <div className="prep-dialog-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        aria-labelledby="prep-dialog-title"
        aria-modal="true"
        className="prep-dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        ref={dialogRef}
        role="dialog"
      >
        <header className="prep-dialog-heading">
          <div>
            <span className="prep-dialog-eyebrow"><CalendarClock size={13} /> PLAN A CONVERSATION</span>
            <h2 id="prep-dialog-title">Add interview preparation</h2>
            <p>Link this interview to an opportunity in your application tracker.</p>
          </div>
          <button aria-label="Close dialog" className="prep-icon-button" onClick={onClose} type="button"><X size={17} /></button>
        </header>
        <form className="prep-form" onSubmit={submit}>
          <FormField label="Job application">
            <select data-autofocus onChange={(event) => setApplicationId(event.target.value)} required value={applicationId}>
              {applications.map((application) => (
                <option key={application.id} value={application.id}>
                  {application.company} · {application.role}
                </option>
              ))}
            </select>
          </FormField>
          <div className="prep-form-row">
            <FormField label="Date and time">
              <input onChange={(event) => setScheduledAt(event.target.value)} required type="datetime-local" value={scheduledAt} />
            </FormField>
            <FormField label="Interview type">
              <input onChange={(event) => setInterviewType(event.target.value)} placeholder="Video interview" value={interviewType} />
            </FormField>
          </div>
          <FormField label="Reminder details" hint="Saved with this interview; this demo does not send notifications.">
            <select onChange={(event) => setReminder(event.target.value as InterviewReminder)} value={reminder}>
              {REMINDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </FormField>
          {validationMessage && <p className="prep-validation" role="alert">{validationMessage}</p>}
          <div className="prep-dialog-actions">
            <button className="button button--secondary" onClick={onClose} type="button">Cancel</button>
            <button className="button button--primary" type="submit"><Plus size={15} /> Create prep workspace</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function StarStoryEditor({
  story,
  onChange,
  onRemove,
}: {
  story: StarStory;
  onChange: (story: StarStory) => void;
  onRemove: () => void;
}) {
  return (
    <article className="prep-star-card">
      <div className="prep-star-heading">
        <FormField label="Story title">
          <input onChange={(event) => onChange({ ...story, title: event.target.value })} placeholder="e.g. Improving a key user flow" value={story.title} />
        </FormField>
        <button aria-label={`Remove ${story.title || "STAR story"}`} className="prep-icon-button prep-icon-button--danger" onClick={onRemove} type="button"><Trash2 size={15} /></button>
      </div>
      <div className="prep-star-grid">
        <FormField label="S · Situation"><PrepTextarea onChange={(value) => onChange({ ...story, situation: value })} placeholder="What was the context?" rows={3} value={story.situation} /></FormField>
        <FormField label="T · Task"><PrepTextarea onChange={(value) => onChange({ ...story, task: value })} placeholder="What needed to be done?" rows={3} value={story.task} /></FormField>
        <FormField label="A · Action"><PrepTextarea onChange={(value) => onChange({ ...story, action: value })} placeholder="What did you specifically do?" rows={3} value={story.action} /></FormField>
        <FormField label="R · Result"><PrepTextarea onChange={(value) => onChange({ ...story, result: value })} placeholder="What changed? Add measurable impact." rows={3} value={story.result} /></FormField>
      </div>
    </article>
  );
}

function InterviewWorkspace({
  preparation,
  application,
  onSave,
}: {
  preparation: InterviewPreparation;
  application: JobApplication;
  onSave: (draft: InterviewPreparationDraft) => boolean;
}) {
  const [draft, setDraft] = useState(() => toDraft(preparation));
  const [activeTab, setActiveTab] = useState<PrepTab>("overview");
  const [savedMessage, setSavedMessage] = useState("");

  function updateDraft(patch: Partial<InterviewPreparationDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSavedMessage("");
  }

  function save() {
    if (onSave(draft)) {
      setSavedMessage("Preparation saved");
      window.setTimeout(() => setSavedMessage(""), 2400);
    }
  }

  function toggleChecklist(id: string) {
    updateDraft({
      checklist: draft.checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    });
  }

  const completeCount = draft.checklist.filter((item) => item.completed).length;
  const completion = draft.checklist.length
    ? Math.round((completeCount / draft.checklist.length) * 100)
    : 0;
  return (
    <section className="prep-workspace">
      <header className="prep-workspace-header">
        <div className="prep-company-lockup">
          <span className="prep-company-mark">{application.company.slice(0, 1)}</span>
          <div>
            <div className="prep-company-line">
              <span>{application.company}</span><span className="prep-type-badge">{draft.interviewType}</span>
            </div>
            <h2>{application.role}</h2>
            <div className="prep-workspace-meta">
              <span><CalendarDays size={13} /> {formatInterviewDate(draft.scheduledAt)}</span>
              <span><Clock3 size={13} /> Reminder: {reminderLabel(draft.reminder)}</span>
              {application.location && <span><MapPin size={13} /> {application.location}</span>}
            </div>
          </div>
        </div>
        <div className="prep-workspace-actions">
          <Link className="prep-application-link" to={`/applications/${application.id}`}>
            View application <ArrowUpRight size={14} />
          </Link>
          <button className="button button--primary prep-save-button" onClick={save} type="button">
            <Save size={14} /> Save prep
          </button>
        </div>
      </header>

      <div className="prep-workspace-toolbar">
        <div aria-label="Interview preparation sections" className="prep-tabs" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              aria-selected={activeTab === id}
              className={activeTab === id ? "prep-tab prep-tab--active" : "prep-tab"}
              id={`prep-tab-${id}`}
              key={id}
              onClick={() => setActiveTab(id)}
              role="tab"
              type="button"
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
        <div aria-live="polite" className="prep-save-feedback">
          {savedMessage && <><Check size={13} /> {savedMessage}</>}
        </div>
      </div>

      <div aria-labelledby={`prep-tab-${activeTab}`} className="prep-tab-content" role="tabpanel">
        {activeTab === "overview" && (
          <div className="prep-overview-grid">
            <section className="prep-content-panel prep-checklist-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--check"><CheckCircle2 size={17} /></div>
                <div><h3>Preparation checklist</h3><p>Small steps to feel ready and present.</p></div>
                <strong className="prep-progress-count">{completeCount}/{draft.checklist.length}</strong>
              </div>
              <div aria-label={`Preparation ${completion}% complete`} className="prep-progress-track">
                <span style={{ width: `${completion}%` }} />
              </div>
              <ul className="prep-checklist">
                {draft.checklist.map((item) => (
                  <li key={item.id}>
                    <button
                      aria-pressed={item.completed}
                      className={item.completed ? "prep-check-button prep-check-button--done" : "prep-check-button"}
                      onClick={() => toggleChecklist(item.id)}
                      type="button"
                    >
                      {item.completed ? <Check size={13} /> : <Circle size={13} />}
                    </button>
                    <span className={item.completed ? "prep-check-label prep-check-label--done" : "prep-check-label"}>{item.label}</span>
                  </li>
                ))}
              </ul>
              <p className="prep-autosave-note">Checklist changes are saved when you select “Save prep”.</p>
            </section>

            <section className="prep-content-panel prep-quick-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--quick"><CalendarClock size={17} /></div>
                <div><h3>Interview details</h3><p>Schedule and reminder information.</p></div>
              </div>
              <div className="prep-detail-list">
                <div><span>Date & time</span><strong>{formatInterviewDate(draft.scheduledAt, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</strong></div>
                <div><span>Format</span><strong>{draft.interviewType || "Not specified"}</strong></div>
                <div><span>Reminder</span><strong>{reminderLabel(draft.reminder)}</strong></div>
                <div><span>Current outcome</span><strong className={`prep-outcome prep-outcome--${draft.outcome}`}>{OUTCOME_OPTIONS.find((item) => item.value === draft.outcome)?.label}</strong></div>
              </div>
              <button className="prep-inline-action" onClick={() => setActiveTab("notes")} type="button">Update outcome and reminders <ChevronRight size={14} /></button>
            </section>

            <section className="prep-content-panel prep-role-summary">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--role"><BriefcaseBusiness size={17} /></div>
                <div><h3>Role at a glance</h3><p>Keep the opportunity context close.</p></div>
              </div>
              <div className="prep-role-facts">
                {application.location && <span><MapPin size={13} /> {application.location}</span>}
                {application.workMode && <span>{application.workMode === "on-site" ? "On-site" : `${application.workMode[0].toUpperCase()}${application.workMode.slice(1)}`}</span>}
                {application.employmentType && <span>{application.employmentType.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("-")}</span>}
              </div>
              <p className="prep-role-summary-copy">{draft.roleNotes || application.description || "Add a few notes about the role and what the team is looking for."}</p>
              <button className="prep-inline-action" onClick={() => setActiveTab("research")} type="button">Review company & role notes <ChevronRight size={14} /></button>
            </section>
          </div>
        )}

        {activeTab === "research" && (
          <div className="prep-edit-grid">
            <section className="prep-content-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--research"><Lightbulb size={17} /></div>
                <div><h3>Company research</h3><p>Capture what you learned and what you want to understand.</p></div>
              </div>
              <FormField label="Research notes" hint="Consider mission, products, recent news, customers, and team culture.">
                <PrepTextarea
                  onChange={(value) => updateDraft({ companyResearch: value })}
                  placeholder="What stands out about this company? Add useful facts, recent updates, or topics to explore..."
                  rows={9}
                  value={draft.companyResearch}
                />
              </FormField>
            </section>
            <section className="prep-content-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--role"><BriefcaseBusiness size={17} /></div>
                <div><h3>Job role notes</h3><p>Connect the role requirements to your own experience.</p></div>
              </div>
              <FormField label="Role information" hint="Pull out the responsibilities, skills, and outcomes that matter most.">
                <PrepTextarea
                  onChange={(value) => updateDraft({ roleNotes: value })}
                  placeholder="What does success in this role look like? Which parts connect to your projects?"
                  rows={9}
                  value={draft.roleNotes}
                />
              </FormField>
              <div className="prep-linked-role">
                <span className="prep-company-mark prep-company-mark--small">{application.company.slice(0, 1)}</span>
                <div><strong>{application.role}</strong><span>{application.company}</span></div>
                <Link aria-label="Open linked job application" to={`/applications/${application.id}`}><ArrowUpRight size={15} /></Link>
              </div>
            </section>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="prep-questions-grid">
            <QuestionListEditor
              description="Thoughtful questions help you learn about the work and team."
              onChange={(values) => updateDraft({ interviewerQuestions: values })}
              placeholder={"How does the team collaborate day to day?\nWhat would you hope this person accomplishes in the first 90 days?"}
              title="Questions to ask the interviewer"
              values={draft.interviewerQuestions}
            />
            <QuestionListEditor
              description="Practice explaining your approach, decisions, and trade-offs."
              onChange={(values) => updateDraft({ technicalQuestions: values })}
              placeholder={"How would you approach improving an existing product flow?\nHow do you make a design accessible?"}
              title="Technical & role-specific questions"
              values={draft.technicalQuestions}
            />
            <QuestionListEditor
              description="Use real examples and structure the answer with STAR."
              onChange={(values) => updateDraft({ behavioralQuestions: values })}
              placeholder={"Tell me about a time you received difficult feedback.\nDescribe a project where priorities changed."}
              title="Behavioral questions"
              values={draft.behavioralQuestions}
            />
          </div>
        )}

        {activeTab === "star" && (
          <section className="prep-content-panel prep-star-workspace">
            <div className="prep-content-title prep-star-intro">
              <div className="prep-title-icon prep-title-icon--star"><Target size={17} /></div>
              <div><h3>Build a strong STAR answer</h3><p>Keep your examples specific, personal, and focused on the impact.</p></div>
              <button
                className="prep-add-inline"
                onClick={() => updateDraft({
                  starStories: [
                    ...draft.starStories,
                    { id: createStoryId(), title: "", situation: "", task: "", action: "", result: "" },
                  ],
                })}
                type="button"
              ><Plus size={14} /> Add story</button>
            </div>
            <div className="prep-star-guide">
              <span><b>S</b><strong>Situation</strong><small>Set the context</small></span>
              <span><b>T</b><strong>Task</strong><small>What was needed?</small></span>
              <span><b>A</b><strong>Action</strong><small>What did you do?</small></span>
              <span><b>R</b><strong>Result</strong><small>What changed?</small></span>
            </div>
            <div className="prep-star-list">
              {draft.starStories.map((story) => (
                <StarStoryEditor
                  key={story.id}
                  onChange={(updated) => updateDraft({
                    starStories: draft.starStories.map((item) => item.id === story.id ? updated : item),
                  })}
                  onRemove={() => updateDraft({
                    starStories: draft.starStories.filter((item) => item.id !== story.id),
                  })}
                  story={story}
                />
              ))}
              {draft.starStories.length === 0 && (
                <div className="prep-empty-stories">
                  <UsersRound size={20} /><strong>No stories yet</strong>
                  <span>Add an example from a project, class, or team experience.</span>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === "notes" && (
          <div className="prep-edit-grid">
            <section className="prep-content-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--notes"><FileText size={17} /></div>
                <div><h3>Personal notes</h3><p>Keep your own reminders and reflections in one place.</p></div>
              </div>
              <FormField label="Notes" hint="These notes stay linked to this interview in this browser.">
                <PrepTextarea
                  onChange={(value) => updateDraft({ personalNotes: value })}
                  placeholder="What do you want to remember before or after this conversation?"
                  rows={8}
                  value={draft.personalNotes}
                />
              </FormField>
            </section>
            <section className="prep-content-panel">
              <div className="prep-content-title">
                <div className="prep-title-icon prep-title-icon--quick"><CalendarClock size={17} /></div>
                <div><h3>Date, reminder & outcome</h3><p>Keep interview logistics and progress up to date.</p></div>
              </div>
              <FormField label="Interview date and time">
                <input
                  onChange={(event) => updateDraft({ scheduledAt: event.target.value })}
                  required
                  type="datetime-local"
                  value={draft.scheduledAt}
                />
              </FormField>
              <FormField label="Interview format">
                <input onChange={(event) => updateDraft({ interviewType: event.target.value })} placeholder="Video interview" value={draft.interviewType} />
              </FormField>
              <FormField label="Reminder detail" hint="Reminder is stored as preparation information; notifications are not sent in this demo.">
                <select onChange={(event) => updateDraft({ reminder: event.target.value as InterviewReminder })} value={draft.reminder}>
                  {REMINDER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </FormField>
              <FormField label="Interview outcome">
                <select onChange={(event) => updateDraft({ outcome: event.target.value as InterviewOutcome })} value={draft.outcome}>
                  {OUTCOME_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </FormField>
              <div className="prep-outcome-note"><Sparkles size={14} /> Outcome is tracked on this interview. Your linked application remains the source of truth for the overall application status.</div>
            </section>
          </div>
        )}
      </div>

      <footer className="prep-workspace-footer">
        <span>Last saved {formatInterviewDate(preparation.updatedAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
        <button className="button button--primary" onClick={save} type="button"><Save size={14} /> Save preparation</button>
      </footer>
    </section>
  );
}

export function InterviewPrepPage() {
  const {
    applications,
    interviewPreparations,
    error,
    addInterviewPreparation,
    editInterviewPreparation,
    deleteInterviewPreparation,
    dismissError,
  } = useApplications();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listMode, setListMode] = useState<ListMode>("upcoming");
  const [isCreating, setIsCreating] = useState(false);
  const [pageMessage, setPageMessage] = useState("");

  const validPreparations = useMemo(
    () => interviewPreparations.filter((preparation) => getApplication(applications, preparation)),
    [interviewPreparations, applications],
  );
  const orderedPreparations = useMemo(
    () => [...validPreparations].sort(
      (first, second) => Date.parse(first.scheduledAt) - Date.parse(second.scheduledAt),
    ),
    [validPreparations],
  );
  const visiblePreparations = listMode === "upcoming"
    ? orderedPreparations.filter(isUpcoming)
    : [...orderedPreparations].reverse().filter((preparation) => !isUpcoming(preparation));
  const selectedPreparation =
    visiblePreparations.find((preparation) => preparation.id === selectedId) ??
    visiblePreparations[0] ??
    orderedPreparations.find((preparation) => preparation.id === selectedId) ??
    null;
  const linkedApplication = selectedPreparation
    ? getApplication(applications, selectedPreparation)
    : undefined;

  function createPreparation(draft: InterviewPreparationDraft) {
    const newId = addInterviewPreparation(draft);
    if (newId) {
      setSelectedId(newId);
      setListMode("upcoming");
      setIsCreating(false);
      setPageMessage("Interview preparation added.");
    }
  }

  function savePreparation(id: string, draft: InterviewPreparationDraft) {
    const saved = editInterviewPreparation(id, draft);
    if (saved) setPageMessage("Interview preparation saved.");
    return saved;
  }

  function removePreparation(preparation: InterviewPreparation) {
    const application = getApplication(applications, preparation);
    if (!window.confirm(`Delete preparation for ${application?.company ?? "this interview"}?`)) return;
    if (deleteInterviewPreparation(preparation.id)) {
      setSelectedId(null);
      setPageMessage("Interview preparation deleted.");
    }
  }

  return (
    <div className="interview-prep-page">
      <header className="prep-page-heading">
        <div>
          <div className="prep-page-eyebrow"><Sparkles size={14} /> YOUR INTERVIEW WORKSPACE</div>
          <h1>Show up ready.</h1>
          <p>Organize your research, practice your stories, and walk into every conversation with confidence.</p>
        </div>
        <button className="button button--primary prep-create-button" disabled={applications.length === 0} onClick={() => setIsCreating(true)} type="button">
          <Plus size={16} /> Add interview
        </button>
      </header>

      {error && (
        <div className="application-error" role="alert">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={dismissError} type="button"><X size={15} /></button>
        </div>
      )}
      {pageMessage && !error && (
        <div className="prep-page-message" role="status">
          <CheckCircle2 size={14} /> {pageMessage}
          <button aria-label="Dismiss message" onClick={() => setPageMessage("")} type="button"><X size={13} /></button>
        </div>
      )}

      <section className="prep-summary-strip" aria-label="Interview preparation summary">
        <div><span className="prep-summary-icon prep-summary-icon--upcoming"><CalendarDays size={16} /></span><span><strong>{orderedPreparations.filter(isUpcoming).length}</strong><small>upcoming interviews</small></span></div>
        <div><span className="prep-summary-icon prep-summary-icon--check"><CheckCircle2 size={16} /></span><span><strong>{orderedPreparations.filter((item) => item.outcome !== "upcoming").length}</strong><small>interviews with outcomes</small></span></div>
        <div><span className="prep-summary-icon prep-summary-icon--companies"><BriefcaseBusiness size={16} /></span><span><strong>{new Set(orderedPreparations.map((item) => item.applicationId)).size}</strong><small>linked opportunities</small></span></div>
      </section>

      {applications.length === 0 ? (
        <section className="prep-empty-page">
          <div className="prep-empty-icon"><BriefcaseBusiness size={22} /></div>
          <h2>Add an application to get started</h2>
          <p>Interview preparation is linked to an opportunity so company and role details stay connected.</p>
          <Link className="button button--primary" to="/applications"><Plus size={15} /> Go to applications</Link>
        </section>
      ) : orderedPreparations.length === 0 ? (
        <section className="prep-empty-page">
          <div className="prep-empty-icon"><CalendarClock size={22} /></div>
          <h2>Your interview workspace is ready</h2>
          <p>Add an upcoming interview and link it to an application to start preparing.</p>
          <button className="button button--primary" onClick={() => setIsCreating(true)} type="button"><Plus size={15} /> Add your first interview</button>
        </section>
      ) : (
        <div className="prep-layout">
          <aside className="prep-interview-list" aria-label="Your interviews">
            <div className="prep-list-heading">
              <div><h2>Your interviews</h2><p>{validPreparations.length} linked {validPreparations.length === 1 ? "interview" : "interviews"}</p></div>
              <button aria-label="Add interview" className="prep-list-add" onClick={() => setIsCreating(true)} type="button"><Plus size={16} /></button>
            </div>
            <div className="prep-list-tabs" role="group" aria-label="Filter interviews">
              <button aria-pressed={listMode === "upcoming"} className={listMode === "upcoming" ? "prep-list-tab prep-list-tab--active" : "prep-list-tab"} onClick={() => setListMode("upcoming")} type="button">Upcoming <span>{orderedPreparations.filter(isUpcoming).length}</span></button>
              <button aria-pressed={listMode === "past"} className={listMode === "past" ? "prep-list-tab prep-list-tab--active" : "prep-list-tab"} onClick={() => setListMode("past")} type="button">Past <span>{orderedPreparations.filter((item) => !isUpcoming(item)).length}</span></button>
            </div>
            <div className="prep-interview-cards">
              {visiblePreparations.map((preparation) => {
                const application = getApplication(applications, preparation);
                if (!application) return null;
                return (
                  <button
                    aria-current={selectedPreparation?.id === preparation.id ? "true" : undefined}
                    className={selectedPreparation?.id === preparation.id ? "prep-interview-card prep-interview-card--active" : "prep-interview-card"}
                    key={preparation.id}
                    onClick={() => {
                      setSelectedId(preparation.id);
                      setPageMessage("");
                    }}
                    type="button"
                  >
                    <span className="prep-card-mark">{application.company.slice(0, 1)}</span>
                    <span className="prep-card-main">
                      <strong>{application.company}</strong>
                      <span>{application.role}</span>
                      <small><CalendarDays size={11} /> {formatInterviewDate(preparation.scheduledAt)}</small>
                      <em className={`prep-outcome prep-outcome--${preparation.outcome}`}>{OUTCOME_OPTIONS.find((item) => item.value === preparation.outcome)?.label}</em>
                    </span>
                    <ChevronRight className="prep-card-chevron" size={15} />
                  </button>
                );
              })}
              {visiblePreparations.length === 0 && (
                <div className="prep-list-empty">
                  <CalendarClock size={18} />
                  <strong>No {listMode} interviews</strong>
                  <span>{listMode === "upcoming" ? "Add an interview and link it to an application." : "Completed interviews will appear here."}</span>
                </div>
              )}
            </div>
          </aside>

          <div className="prep-main-column">
            {selectedPreparation && linkedApplication ? (
              <>
                <InterviewWorkspace
                  key={selectedPreparation.id}
                  application={linkedApplication}
                  onSave={(draft) => savePreparation(selectedPreparation.id, draft)}
                  preparation={selectedPreparation}
                />
                <div className="prep-record-actions">
                  <span>Preparing for {linkedApplication.company} · {linkedApplication.role}</span>
                  <button className="prep-delete-link" onClick={() => removePreparation(selectedPreparation)} type="button"><Trash2 size={13} /> Delete interview prep</button>
                </div>
              </>
            ) : (
              <section className="prep-empty-selection">
                <CalendarClock size={22} />
                <h2>Select an interview to prepare</h2>
                <p>Choose an interview from your list or add a new one.</p>
              </section>
            )}
          </div>
        </div>
      )}

      {isCreating && (
        <InterviewCreateDialog
          applications={applications}
          onClose={() => setIsCreating(false)}
          onCreate={createPreparation}
        />
      )}
    </div>
  );
}
