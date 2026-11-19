import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { useModalFocus } from "@/hooks/useModalFocus";
import {
  SKILL_CATEGORIES,
  type SkillCategory,
  type SkillLearningStatus,
  type SkillPriority,
  type SkillProficiency,
  type TrackedSkillDraft,
} from "../types";

const PROFICIENCIES: { value: SkillProficiency; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "learning", label: "Learning" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LEARNING_STATUSES: { value: SkillLearningStatus; label: string }[] = [
  { value: "have", label: "I have this skill" },
  { value: "learning", label: "Currently learning" },
  { value: "to-learn", label: "Need to learn" },
  { value: "completed", label: "Completed" },
];

const PRIORITIES: { value: SkillPriority; label: string }[] = [
  { value: "high", label: "High priority" },
  { value: "medium", label: "Medium priority" },
  { value: "low", label: "Low priority" },
];

function isCategory(value: string): value is SkillCategory {
  return SKILL_CATEGORIES.some((category) => category === value);
}

export function AddSkillDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: TrackedSkillDraft) => void;
}) {
  const dialogRef = useModalFocus<HTMLElement>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SkillCategory>("Frontend");
  const [proficiency, setProficiency] = useState<SkillProficiency>("beginner");
  const [learningStatus, setLearningStatus] =
    useState<SkillLearningStatus>("to-learn");
  const [progress, setProgress] = useState(0);
  const [priority, setPriority] = useState<SkillPriority>("medium");
  const [manualRequired, setManualRequired] = useState(true);
  const [resources, setResources] = useState("");
  const [validationMessage, setValidationMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setValidationMessage("Enter a skill name to add it to your roadmap.");
      return;
    }
    onSave({
      name: name.trim(),
      category,
      proficiency,
      learningStatus,
      progress:
        learningStatus === "completed" || learningStatus === "have"
          ? 100
          : Math.min(100, Math.max(0, Math.round(progress))),
      priority,
      manualRequired,
      resources: resources.split("\n").map((resource) => resource.trim()).filter(Boolean),
    });
  }

  return (
    <div
      className="skill-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="skill-dialog-title"
        aria-modal="true"
        className="skill-dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        ref={dialogRef}
        role="dialog"
      >
        <header className="skill-dialog-heading">
          <div>
            <span className="skill-dialog-eyebrow">BUILD YOUR ROADMAP</span>
            <h2 id="skill-dialog-title">Add a skill</h2>
            <p>Track a strength or a skill you want to build next.</p>
          </div>
          <button aria-label="Close dialog" className="skill-icon-button" onClick={onClose} type="button"><X size={17} /></button>
        </header>
        <form className="skill-form" onSubmit={submit}>
          <label className="skill-field">
            <span>Skill name</span>
            <input autoFocus data-autofocus onChange={(event) => setName(event.target.value)} placeholder="e.g. React" value={name} />
          </label>
          <div className="skill-form-row">
            <label className="skill-field">
              <span>Category</span>
              <select onChange={(event) => {
                if (isCategory(event.target.value)) setCategory(event.target.value);
              }} value={category}>
                {SKILL_CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="skill-field">
              <span>Proficiency</span>
              <select onChange={(event) => setProficiency(event.target.value as SkillProficiency)} value={proficiency}>
                {PROFICIENCIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
          <div className="skill-form-row">
            <label className="skill-field">
              <span>Learning status</span>
              <select onChange={(event) => setLearningStatus(event.target.value as SkillLearningStatus)} value={learningStatus}>
                {LEARNING_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="skill-field">
              <span>Priority</span>
              <select onChange={(event) => setPriority(event.target.value as SkillPriority)} value={priority}>
                {PRIORITIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
          </div>
          {learningStatus === "learning" && (
            <label className="skill-field">
              <span>Learning progress · {progress}%</span>
              <input max="100" min="0" onChange={(event) => setProgress(Number(event.target.value))} type="range" value={progress} />
            </label>
          )}
          <label className="skill-field">
            <span>Learning resources</span>
            <textarea onChange={(event) => setResources(event.target.value)} placeholder={"One resource per line, e.g.\nOfficial documentation\nCourse or tutorial"} rows={3} value={resources} />
          </label>
          <label className="skill-required-toggle">
            <input checked={manualRequired} onChange={(event) => setManualRequired(event.target.checked)} type="checkbox" />
            <span><strong>Required for my target role</strong><small>Include this skill in your required-skill progress.</small></span>
          </label>
          {validationMessage && <p className="skill-validation" role="alert">{validationMessage}</p>}
          <div className="skill-dialog-actions">
            <button className="button button--secondary" onClick={onClose} type="button">Cancel</button>
            <button className="button button--primary" type="submit"><Plus size={15} /> Add skill</button>
          </div>
        </form>
      </section>
    </div>
  );
}
