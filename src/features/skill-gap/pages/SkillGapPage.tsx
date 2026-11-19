import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Code2,
  Database,
  ExternalLink,
  Layers3,
  Lightbulb,
  ListChecks,
  Plus,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApplications } from "@/features/applications/hooks/useApplications";
import { mockJobs } from "@/features/job-discovery/services/mockJobs";
import { AddSkillDialog } from "../components/AddSkillDialog";
import {
  addTrackedSkill,
  compareSavedJobs,
  deleteTrackedSkill,
  getSavedListings,
  loadSkillPlan,
  persistSkillPlan,
  resetSkillPlan,
  updateTargetRole,
  updateTrackedSkill,
} from "../services/skillGapService";
import {
  SKILL_CATEGORIES,
  type SkillCategory,
  type SkillLearningStatus,
  type SkillPriority,
  type SkillProficiency,
  type SkillGapPlan,
  type TrackedSkill,
  type TrackedSkillDraft,
} from "../types";

type SkillFilter = "all" | "required" | "learning" | "completed";

const CATEGORY_ICONS: Record<SkillCategory, typeof Code2> = {
  Frontend: Code2,
  Backend: Layers3,
  Database,
  Tools: Wrench,
  "Soft Skills": Sparkles,
};

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  Frontend: "#7368de",
  Backend: "#62a2bf",
  Database: "#d3a15c",
  Tools: "#8d7acb",
  "Soft Skills": "#65a786",
};

const STATUS_LABELS: Record<SkillLearningStatus, string> = {
  have: "I have this",
  learning: "Learning",
  "to-learn": "To learn",
  completed: "Completed",
};

const PROFICIENCY_LABELS: Record<SkillProficiency, string> = {
  beginner: "Beginner",
  learning: "Learning",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const PRIORITY_LABELS: Record<SkillPriority, string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

const FILTERS: { id: SkillFilter; label: string }[] = [
  { id: "all", label: "All skills" },
  { id: "required", label: "Required" },
  { id: "learning", label: "Learning" },
  { id: "completed", label: "Completed" },
];

function isRequired(skill: TrackedSkill, plan: SkillGapPlan | null) {
  return skill.manualRequired || Boolean(plan && skill.sourceJobIds.some((id) => plan.selectedJobIds.includes(id)));
}

function effectiveProgress(skill: TrackedSkill) {
  return skill.learningStatus === "have" || skill.learningStatus === "completed"
    ? 100
    : skill.progress;
}

function formatUpdated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CategoryChart({ skills, plan }: { skills: TrackedSkill[]; plan: SkillGapPlan }) {
  const data = SKILL_CATEGORIES.map((category) => {
    const categorySkills = skills.filter((skill) => skill.category === category && isRequired(skill, plan));
    return {
      category,
      Have: categorySkills.filter((skill) => skill.learningStatus === "have" || skill.learningStatus === "completed").length,
      Learning: categorySkills.filter((skill) => skill.learningStatus === "learning").length,
      "To learn": categorySkills.filter((skill) => skill.learningStatus === "to-learn").length,
    };
  }).filter((item) => item.Have + item.Learning + item["To learn"] > 0);

  if (data.length === 0) {
    return (
      <div className="skill-chart-empty">
        <Target size={19} />
        <span>Add or compare required skills to see category progress.</span>
      </div>
    );
  }

  return (
    <div aria-label="Required skills by category and learning status" className="skill-chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 4, left: -21, bottom: 0 }}>
          <CartesianGrid stroke="#f0eff5" strokeDasharray="3 4" vertical={false} />
          <XAxis axisLine={false} dataKey="category" tick={{ fill: "#85869a", fontSize: 8 }} tickLine={false} />
          <YAxis allowDecimals={false} axisLine={false} tick={{ fill: "#a1a2b0", fontSize: 8 }} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(110, 98, 210, 0.045)" }}
            contentStyle={{ border: "1px solid #ecebf4", borderRadius: 9, fontSize: 9, boxShadow: "0 6px 20px rgba(34,35,60,.08)" }}
          />
          <Bar dataKey="Have" fill="#68ae88" radius={[3, 3, 0, 0]} stackId="skills" />
          <Bar dataKey="Learning" fill="#8075e4" radius={[3, 3, 0, 0]} stackId="skills" />
          <Bar dataKey="To learn" fill="#e2bb79" radius={[3, 3, 0, 0]} stackId="skills" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SavedRoleComparison({
  savedJobs,
  selectedIds,
  onCompare,
}: {
  savedJobs: typeof mockJobs;
  selectedIds: string[];
  onCompare: (selectedIds: string[]) => boolean;
}) {
  const [selected, setSelected] = useState(selectedIds);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedIds = new Set(savedJobs.map((job) => job.id));
    setSelected(selectedIds.filter((id) => savedIds.has(id)));
  }, [savedJobs, selectedIds]);

  function toggle(jobId: string) {
    setSelected((current) =>
      current.includes(jobId)
        ? current.filter((id) => id !== jobId)
        : [...current, jobId],
    );
    setMessage("");
  }

  function compare() {
    if (onCompare(selected)) setMessage("Required skills updated from your selected saved jobs.");
  }

  return (
    <section className="skill-saved-roles content-panel">
      <div className="skill-section-heading">
        <div>
          <span className="skill-section-icon skill-section-icon--saved"><BriefcaseBusiness size={16} /></span>
          <div><h2>Compare saved job descriptions</h2><p>Bring skills from your saved Launchpad listings into this roadmap.</p></div>
        </div>
        <span className="skill-source-count">{savedJobs.length} saved {savedJobs.length === 1 ? "role" : "roles"}</span>
      </div>

      {savedJobs.length === 0 ? (
        <div className="skill-no-saved">
          <div><BookOpen size={16} /><span>Save jobs in Discover Jobs to compare their listed skills with your roadmap.</span></div>
          <a className="skill-inline-link" href="/job-discovery">Explore jobs <ArrowUpRight size={13} /></a>
        </div>
      ) : (
        <>
          <div className="skill-saved-grid">
            {savedJobs.map((job) => {
              const checked = selected.includes(job.id);
              return (
                <label className={checked ? "skill-source-card skill-source-card--selected" : "skill-source-card"} key={job.id}>
                  <input checked={checked} onChange={() => toggle(job.id)} type="checkbox" />
                  <span className="skill-source-logo">{job.company.slice(0, 1)}</span>
                  <span className="skill-source-info">
                    <strong>{job.company}</strong>
                    <small>{job.role}</small>
                    <span>{job.skills.slice(0, 4).join(" · ")}{job.skills.length > 4 ? " +" : ""}</span>
                  </span>
                  <ChevronDown className={checked ? "skill-source-check skill-source-check--active" : "skill-source-check"} size={15} />
                </label>
              );
            })}
          </div>
          <div className="skill-compare-footer">
            <span>{selected.length} selected · skills from selected listings count as required</span>
            <div>
              {message && <small role="status"><CheckCircle2 size={12} /> {message}</small>}
              <button className="button button--primary skill-compare-button" onClick={compare} type="button">
                <RefreshCw size={13} /> Compare skills
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function SkillCard({
  skill,
  required,
  sourceNames,
  onUpdate,
  onDelete,
}: {
  skill: TrackedSkill;
  required: boolean;
  sourceNames: string[];
  onUpdate: (changes: Partial<TrackedSkillDraft>) => void;
  onDelete: () => void;
}) {
  const [resourceInput, setResourceInput] = useState("");
  const Icon = CATEGORY_ICONS[skill.category];
  const progress = effectiveProgress(skill);

  function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const resource = resourceInput.trim();
    if (!resource) return;
    onUpdate({ resources: [...skill.resources, resource] });
    setResourceInput("");
  }

  return (
    <article className={`skill-card${skill.learningStatus === "completed" ? " skill-card--completed" : ""}`}>
      <div className="skill-card-heading">
        <span className="skill-card-icon" style={{ color: CATEGORY_COLORS[skill.category] }}><Icon size={16} /></span>
        <div className="skill-card-name">
          <h3>{skill.name}</h3>
          <span>{skill.category}</span>
        </div>
        <button aria-label={`Remove ${skill.name}`} className="skill-delete-button" onClick={onDelete} type="button"><Trash2 size={14} /></button>
      </div>

      <div className="skill-card-badges">
        {required && <span className="skill-required-badge"><Target size={10} /> Required</span>}
        <span className={`skill-priority-badge skill-priority-badge--${skill.priority}`}>{PRIORITY_LABELS[skill.priority]}</span>
      </div>
      {sourceNames.length > 0 && (
        <p className="skill-source-caption">From {sourceNames.join(", ")}</p>
      )}

      <div className="skill-card-controls">
        <label>
          <span>Learning status</span>
          <select
            onChange={(event) => onUpdate({ learningStatus: event.target.value as SkillLearningStatus })}
            value={skill.learningStatus}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span>Proficiency</span>
          <select
            onChange={(event) => onUpdate({ proficiency: event.target.value as SkillProficiency })}
            value={skill.proficiency}
          >
            {Object.entries(PROFICIENCY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="skill-progress-heading">
        <span>{skill.learningStatus === "have" || skill.learningStatus === "completed" ? "Mastery" : "Learning progress"}</span>
        <strong>{progress}%</strong>
      </div>
      <div aria-label={`${skill.name} ${progress}% complete`} className="skill-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${progress}%`, background: CATEGORY_COLORS[skill.category] }} />
      </div>
      {skill.learningStatus === "learning" && (
        <label className="skill-progress-slider">
          <span className="sr-only">Update {skill.name} learning progress</span>
          <input
            max="100"
            min="0"
            onChange={(event) => onUpdate({ progress: Number(event.target.value) })}
            type="range"
            value={skill.progress}
          />
        </label>
      )}

      <div className="skill-resources">
        <div className="skill-resource-heading"><BookOpen size={12} /><strong>Learning resources</strong><span>{skill.resources.length}</span></div>
        {skill.resources.length > 0 ? (
          <ul>
            {skill.resources.map((resource, index) => (
              <li key={`${resource}-${index}`}>
                <a href={/^https?:\/\//i.test(resource) ? resource : undefined} rel="noreferrer" target={/^https?:\/\//i.test(resource) ? "_blank" : undefined}>
                  {resource}{/^https?:\/\//i.test(resource) && <ExternalLink size={10} />}
                </a>
                <button aria-label={`Remove resource ${resource}`} onClick={() => onUpdate({ resources: skill.resources.filter((_, resourceIndex) => resourceIndex !== index) })} type="button"><X size={11} /></button>
              </li>
            ))}
          </ul>
        ) : <p className="skill-no-resources">Add a course, tutorial, or reference.</p>}
        <form className="skill-resource-form" onSubmit={addResource}>
          <input aria-label={`Add learning resource for ${skill.name}`} onChange={(event) => setResourceInput(event.target.value)} placeholder="Add a learning resource…" value={resourceInput} />
          <button aria-label={`Save resource for ${skill.name}`} disabled={!resourceInput.trim()} type="submit"><Plus size={13} /></button>
        </form>
      </div>

      {skill.learningStatus !== "completed" && (
        <button className="skill-complete-button" onClick={() => onUpdate({ learningStatus: "completed", progress: 100 })} type="button">
          <CheckCircle2 size={13} /> Mark skill completed
        </button>
      )}
      <span className="skill-updated">Updated {formatUpdated(skill.updatedAt)}</span>
    </article>
  );
}

function SkillError({ message, onReset }: { message: string; onReset: () => void }) {
  return (
    <div className="skill-error" role="alert">
      <CircleHelp size={17} />
      <div><strong>Couldn’t load your skill roadmap</strong><span>{message}</span></div>
      <button className="button button--secondary" onClick={onReset} type="button">Reset demo data</button>
    </div>
  );
}

export function SkillGapPage() {
  const { savedJobIds } = useApplications();
  const [initialState] = useState(() => {
    try {
      return { plan: loadSkillPlan(), error: null as string | null };
    } catch (error) {
      return {
        plan: null,
        error: error instanceof Error ? error.message : "Could not load your skills.",
      };
    }
  });
  const [plan, setPlan] = useState<SkillGapPlan | null>(initialState.plan);
  const [error, setError] = useState<string | null>(initialState.error);
  const [message, setMessage] = useState("");
  const [targetRoleInput, setTargetRoleInput] = useState(initialState.plan?.targetRole ?? "");
  const [targetRoleEditing, setTargetRoleEditing] = useState(false);
  const [roleValidation, setRoleValidation] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<SkillCategory | "all">("all");
  const [skillFilter, setSkillFilter] = useState<SkillFilter>("all");

  const savedJobs = useMemo(() => getSavedListings(savedJobIds), [savedJobIds]);
  useEffect(() => {
    if (!plan) return;
    const savedIds = new Set(savedJobs.map((job) => job.id));
    const validSelectedIds = plan.selectedJobIds.filter((id) => savedIds.has(id));
    if (validSelectedIds.length !== plan.selectedJobIds.length) {
      try {
        const nextPlan = compareSavedJobs(plan, validSelectedIds, savedJobs);
        persistSkillPlan(nextPlan);
        setPlan(nextPlan);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not update saved-job comparisons.");
      }
    }
  }, [plan, savedJobs]);
  const requiredSkills = useMemo(
    () => plan?.skills.filter((skill) => isRequired(skill, plan)) ?? [],
    [plan],
  );
  const currentSkills = plan?.skills.filter(
    (skill) => skill.learningStatus === "have" || skill.learningStatus === "completed",
  ) ?? [];
  const learningSkills = plan?.skills.filter((skill) => skill.learningStatus === "learning") ?? [];
  const gapSkills = requiredSkills.filter(
    (skill) => skill.learningStatus !== "have" && skill.learningStatus !== "completed",
  );
  const overallProgress = requiredSkills.length
    ? Math.round(requiredSkills.reduce((sum, skill) => sum + effectiveProgress(skill), 0) / requiredSkills.length)
    : 0;
  const roadmapSkills = [...gapSkills].sort((first, second) => {
    const rank: Record<SkillPriority, number> = { high: 0, medium: 1, low: 2 };
    return rank[first.priority] - rank[second.priority] ||
      effectiveProgress(first) - effectiveProgress(second);
  });
  const visibleSkills = (plan?.skills ?? []).filter((skill) => {
    const categoryMatches = categoryFilter === "all" || skill.category === categoryFilter;
    const filterMatches =
      skillFilter === "all" ||
      (skillFilter === "required" && isRequired(skill, plan)) ||
      (skillFilter === "learning" && skill.learningStatus === "learning") ||
      (skillFilter === "completed" && skill.learningStatus === "completed");
    return categoryMatches && filterMatches;
  });

  function commit(nextPlan: SkillGapPlan, successMessage?: string) {
    try {
      persistSkillPlan(nextPlan);
      setPlan(nextPlan);
      setTargetRoleInput(nextPlan.targetRole);
      setError(null);
      if (successMessage) setMessage(successMessage);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your skill roadmap.");
      return false;
    }
  }

  function saveTargetRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!plan) return;
    if (!targetRoleInput.trim()) {
      setRoleValidation("Enter a target job role.");
      return;
    }
    if (commit(updateTargetRole(plan, targetRoleInput), "Target role updated.")) {
      setTargetRoleEditing(false);
      setRoleValidation("");
    }
  }

  function saveNewSkill(draft: TrackedSkillDraft) {
    if (!plan) return;
    try {
      const nextPlan = addTrackedSkill(plan, draft);
      if (commit(nextPlan, `${draft.name} added to your roadmap.`)) setIsAddingSkill(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add that skill.");
    }
  }

  function updateSkill(id: string, changes: Partial<TrackedSkillDraft>) {
    if (!plan) return;
    try {
      commit(updateTrackedSkill(plan, id, changes));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update that skill.");
    }
  }

  function removeSkill(skill: TrackedSkill) {
    if (!plan || !window.confirm(`Remove ${skill.name} from your skill roadmap?`)) return;
    try {
      commit(deleteTrackedSkill(plan, skill.id), `${skill.name} removed from your roadmap.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove that skill.");
    }
  }

  function compareJobs(selectedIds: string[]) {
    if (!plan) return false;
    const nextPlan = compareSavedJobs(plan, selectedIds, savedJobs);
    return commit(nextPlan, "Required skills updated from your saved job listings.");
  }

  function resetPlan() {
    try {
      const nextPlan = resetSkillPlan();
      setPlan(nextPlan);
      setTargetRoleInput(nextPlan.targetRole);
      setError(null);
      setMessage("Demo skill roadmap restored.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset your skill roadmap.");
    }
  }

  return (
    <div className="skill-gap-page">
      <header className="skill-page-heading">
        <div>
          <div className="skill-page-eyebrow"><Target size={14} /> YOUR LEARNING ROADMAP</div>
          <h1>Build skills for what’s next.</h1>
          <p>Turn your target role into a practical plan, grounded in the skills companies ask for.</p>
        </div>
        <button className="button button--primary skill-add-button" disabled={!plan} onClick={() => setIsAddingSkill(true)} type="button">
          <Plus size={16} /> Add a skill
        </button>
      </header>

      {error && (
        plan ? (
          <div className="application-error" role="alert">
            <span>{error}</span><button aria-label="Dismiss error" onClick={() => setError(null)} type="button"><X size={15} /></button>
          </div>
        ) : <SkillError message={error} onReset={resetPlan} />
      )}
      {message && !error && (
        <div className="skill-success-message" role="status">
          <CheckCircle2 size={14} /> {message}
          <button aria-label="Dismiss message" onClick={() => setMessage("")} type="button"><X size={13} /></button>
        </div>
      )}

      {!plan ? (
        <section className="skill-empty-plan">
          <div><CircleHelp size={20} /></div>
          <h2>Your roadmap needs attention</h2>
          <p>Reset the local demo data to restore the starter skill plan.</p>
          <button className="button button--primary" onClick={resetPlan} type="button"><RefreshCw size={14} /> Reset roadmap</button>
        </section>
      ) : (
        <>
          <section className="skill-target-panel">
            <div className="skill-target-main">
              <span className="skill-target-icon"><BriefcaseBusiness size={19} /></span>
              <div>
                <span className="skill-target-label">YOUR TARGET ROLE</span>
                {targetRoleEditing ? (
                  <form className="skill-target-edit" onSubmit={saveTargetRole}>
                    <input autoFocus aria-label="Target job role" onChange={(event) => setTargetRoleInput(event.target.value)} value={targetRoleInput} />
                    <button aria-label="Save target job role" className="skill-icon-button" type="submit"><Check size={14} /></button>
                    <button aria-label="Cancel editing target job role" className="skill-icon-button skill-icon-button--quiet" onClick={() => { setTargetRoleInput(plan.targetRole); setTargetRoleEditing(false); setRoleValidation(""); }} type="button"><X size={14} /></button>
                    {roleValidation && <small role="alert">{roleValidation}</small>}
                  </form>
                ) : (
                  <button className="skill-target-role" onClick={() => setTargetRoleEditing(true)} type="button">
                    <strong>{plan.targetRole || "Add your target role"}</strong>
                    <span>Edit role</span>
                  </button>
                )}
              </div>
            </div>
            <div className="skill-target-note"><Lightbulb size={14} /> Compare saved job skills to tailor this roadmap to roles you want.</div>
          </section>

          <section className="skill-overview-grid" aria-label="Skill progress overview">
            <article className="skill-progress-overview content-panel">
              <div className="skill-section-heading">
                <div>
                  <span className="skill-section-icon skill-section-icon--progress"><Target size={16} /></span>
                  <div><h2>Role readiness</h2><p>Progress across your required skills</p></div>
                </div>
              </div>
              <div className="skill-readiness-content">
                <div aria-label={`Required skill progress ${overallProgress}%`} className="skill-readiness-ring" role="img" style={{ background: `conic-gradient(#7065dc ${overallProgress * 3.6}deg, #edecf4 0deg)` }}>
                  <div><strong>{overallProgress}%</strong><span>progress</span></div>
                </div>
                <div className="skill-readiness-stats">
                  <div><span className="skill-stat-dot skill-stat-dot--have" /><span>Skills I have</span><strong>{requiredSkills.filter((skill) => skill.learningStatus === "have" || skill.learningStatus === "completed").length}</strong></div>
                  <div><span className="skill-stat-dot skill-stat-dot--learning" /><span>In progress</span><strong>{requiredSkills.filter((skill) => skill.learningStatus === "learning").length}</strong></div>
                  <div><span className="skill-stat-dot skill-stat-dot--gap" /><span>Need to learn</span><strong>{gapSkills.filter((skill) => skill.learningStatus === "to-learn").length}</strong></div>
                  <small>{requiredSkills.length} required skills across {new Set(requiredSkills.map((skill) => skill.category)).size} categories</small>
                </div>
              </div>
              <div className="skill-progress-footnote">
                {requiredSkills.length
                  ? `Average progress: owned/completed skills count as 100%, learning skills use their progress, and planned skills count as 0%.`
                  : "Add role requirements or compare saved jobs to start tracking readiness."}
              </div>
            </article>

            <article className="skill-category-overview content-panel">
              <div className="skill-section-heading">
                <div>
                  <span className="skill-section-icon skill-section-icon--category"><Layers3 size={16} /></span>
                  <div><h2>Skills by category</h2><p>Required skills grouped by area</p></div>
                </div>
              </div>
              <CategoryChart plan={plan} skills={plan.skills} />
              <div className="skill-chart-legend">
                <span><i className="skill-stat-dot--have" /> Have</span>
                <span><i className="skill-stat-dot--learning" /> Learning</span>
                <span><i className="skill-stat-dot--gap" /> To learn</span>
              </div>
            </article>

            <article className="skill-totals-overview content-panel">
              <div className="skill-section-heading">
                <div>
                  <span className="skill-section-icon skill-section-icon--total"><ListChecks size={16} /></span>
                  <div><h2>Your skill inventory</h2><p>All skills in your roadmap</p></div>
                </div>
              </div>
              <div className="skill-inventory-stats">
                <div><strong>{plan.skills.length}</strong><span>Tracked</span></div>
                <div><strong>{currentSkills.length}</strong><span>Have</span></div>
                <div><strong>{learningSkills.length}</strong><span>Learning</span></div>
                <div><strong>{gapSkills.length}</strong><span>Gaps</span></div>
              </div>
              <div className="skill-inventory-note"><Sparkles size={13} /> Your list stays private in this browser.</div>
            </article>
          </section>

          <SavedRoleComparison
            onCompare={compareJobs}
            savedJobs={savedJobs}
            selectedIds={plan.selectedJobIds}
          />

          <section className="skill-roadmap-section">
            <div className="skill-roadmap-heading">
              <div>
                <div className="skill-section-heading">
                  <div>
                    <span className="skill-section-icon skill-section-icon--roadmap"><ArrowUpRight size={16} /></span>
                    <div><h2>Your learning roadmap</h2><p>Practice, track progress, and add resources for each skill.</p></div>
                  </div>
                </div>
              </div>
              <button className="button button--secondary skill-add-secondary" onClick={() => setIsAddingSkill(true)} type="button"><Plus size={14} /> Add skill</button>
            </div>

            {roadmapSkills.length > 0 && (
              <section className="skill-priority-roadmap">
                <div className="skill-roadmap-intro">
                  <span className="skill-roadmap-icon"><ArrowDownRight size={15} /></span>
                  <div><strong>Suggested next steps</strong><span>Required skills, sorted by priority and learning progress</span></div>
                  <span className="skill-roadmap-pill">{roadmapSkills.length} to build</span>
                </div>
                <div className="skill-roadmap-steps">
                  {roadmapSkills.slice(0, 4).map((skill, index) => (
                    <div className="skill-roadmap-step" key={skill.id}>
                      <span className="skill-step-number">{String(index + 1).padStart(2, "0")}</span>
                      <span className="skill-step-info"><strong>{skill.name}</strong><small>{skill.category} · {STATUS_LABELS[skill.learningStatus]}</small></span>
                      <span className={`skill-priority-badge skill-priority-badge--${skill.priority}`}>{PRIORITY_LABELS[skill.priority]}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="skill-list-controls">
              <div className="skill-filter-tabs" role="group" aria-label="Filter skills by status">
                {FILTERS.map((filter) => (
                  <button aria-pressed={skillFilter === filter.id} className={skillFilter === filter.id ? "skill-filter-tab skill-filter-tab--active" : "skill-filter-tab"} key={filter.id} onClick={() => setSkillFilter(filter.id)} type="button">
                    {filter.label}
                    <span>{filter.id === "all" ? plan.skills.length : filter.id === "required" ? requiredSkills.length : filter.id === "learning" ? learningSkills.length : plan.skills.filter((skill) => skill.learningStatus === "completed").length}</span>
                  </button>
                ))}
              </div>
              <label className="skill-category-select">
                <span className="sr-only">Filter by skill category</span>
                <select onChange={(event) => setCategoryFilter(event.target.value === "all" ? "all" : SKILL_CATEGORIES.find((category) => category === event.target.value) ?? "all")} value={categoryFilter}>
                  <option value="all">All categories</option>
                  {SKILL_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
            </div>

            {visibleSkills.length === 0 ? (
              <div className="skill-empty-list"><Target size={18} /><strong>No skills in this view</strong><span>Change a filter or add a skill to your roadmap.</span></div>
            ) : (
              <div className="skill-card-grid">
                {visibleSkills.map((skill) => {
                  const sourceNames = skill.sourceJobIds
                    .filter((jobId) => plan.selectedJobIds.includes(jobId))
                    .map((jobId) => savedJobs.find((job) => job.id === jobId)?.company)
                    .filter((company): company is string => Boolean(company));
                  return (
                    <SkillCard
                      key={skill.id}
                      onDelete={() => removeSkill(skill)}
                      onUpdate={(changes) => updateSkill(skill.id, changes)}
                      required={isRequired(skill, plan)}
                      skill={skill}
                      sourceNames={sourceNames}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <footer className="skill-data-footer">
            <span><CircleHelp size={13} /> Local demo data · saved job skills come from the listings you bookmark.</span>
            <span>Last updated {formatUpdated(plan.updatedAt)}</span>
          </footer>
        </>
      )}

      {isAddingSkill && <AddSkillDialog onClose={() => setIsAddingSkill(false)} onSave={saveNewSkill} />}
    </div>
  );
}
