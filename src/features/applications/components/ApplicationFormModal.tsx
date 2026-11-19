import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useModalFocus } from "@/hooks/useModalFocus";
import {
  APPLICATION_STATUSES,
  type ApplicationDraft,
  type EmploymentType,
  type JobApplication,
  type WorkMode,
} from "../types";

interface ApplicationFormModalProps {
  application?: JobApplication;
  onClose: () => void;
  onSave: (draft: ApplicationDraft) => boolean | Promise<boolean>;
}

interface FormValues {
  company: string;
  role: string;
  description: string;
  website: string;
  listingUrl: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salaryRange: string;
  applicationDate: string;
  status: JobApplication["status"];
  notes: string;
  contactPerson: string;
  followUpDate: string;
  tags: string;
  interviewAt: string;
  interviewType: string;
}

const WORK_MODES: WorkMode[] = ["remote", "hybrid", "on-site"];
const EMPLOYMENT_TYPES: EmploymentType[] = ["internship", "full-time", "part-time", "contract"];

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTimeValue(value: string | undefined) {
  if (!value) {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(14, 0, 0, 0);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  }
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function initialValues(application?: JobApplication): FormValues {
  return {
    company: application?.company ?? "",
    role: application?.role ?? "",
    description: application?.description ?? "",
    website: application?.website ?? "",
    listingUrl: application?.listingUrl ?? "",
    location: application?.location ?? "",
    workMode: application?.workMode ?? "remote",
    employmentType: application?.employmentType ?? "full-time",
    salaryRange: application?.salaryRange ?? "",
    applicationDate: application?.applicationDate ?? localDateValue(new Date()),
    status: application?.status ?? "applied",
    notes: application?.notes ?? "",
    contactPerson: application?.contactPerson ?? "",
    followUpDate: application?.followUpDate ?? "",
    tags: application?.tags.join(", ") ?? "",
    interviewAt: localDateTimeValue(application?.interviewAt),
    interviewType: application?.interviewType ?? "Video call",
  };
}

export function ApplicationFormModal({
  application,
  onClose,
  onSave,
}: ApplicationFormModalProps) {
  const [values, setValues] = useState(() => initialValues(application));
  const [saving, setSaving] = useState(false);
  const dialogRef = useModalFocus<HTMLElement>();

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const applicationDate = new Date(`${values.applicationDate}T12:00:00`).toISOString();
    setSaving(true);
    try {
      const saved = await onSave({
      company: values.company.trim(),
      role: values.role.trim(),
      description: values.description.trim(),
      website: values.website.trim(),
      listingUrl: values.listingUrl.trim(),
      location: values.location.trim(),
      workMode: values.workMode,
      employmentType: values.employmentType,
      salaryRange: values.salaryRange.trim(),
      applicationDate: values.applicationDate,
      status: values.status,
      appliedAt: values.status === "wishlist" ? undefined : applicationDate,
      notes: values.notes.trim(),
      contactPerson: values.contactPerson.trim(),
      followUpDate: values.followUpDate || undefined,
      tags: [...new Set(values.tags.split(",").map((tag) => tag.trim()).filter(Boolean))],
      ...(values.status === "interview"
        ? {
            interviewAt: new Date(values.interviewAt).toISOString(),
            interviewType: values.interviewType,
          }
        : {
            interviewAt: undefined,
            interviewType: undefined,
          }),
      });
      if (saved) onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop application-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby="application-form-title"
        aria-modal="true"
        className="application-modal application-form-modal"
        ref={dialogRef}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        role="dialog"
      >
        <div className="modal-heading">
          <div>
            <span className="eyebrow">APPLICATION TRACKER</span>
            <h2 id="application-form-title">
              {application ? "Edit application" : "Add an application"}
            </h2>
            <p>Keep every opportunity and next step in one place.</p>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>
        <form className="application-form application-form--scroll" onSubmit={(event) => void handleSubmit(event)}>
          <div className="form-section-label">ROLE DETAILS</div>
          <div className="form-row">
            <label>
              Company <span className="required-mark">*</span>
              <input
                autoComplete="organization"
                autoFocus
                data-autofocus
                maxLength={100}
                onChange={(event) => update("company", event.target.value)}
                placeholder="e.g. Acme"
                required
                value={values.company}
              />
            </label>
            <label>
              Job title <span className="required-mark">*</span>
              <input
                autoComplete="organization-title"
                maxLength={120}
                onChange={(event) => update("role", event.target.value)}
                placeholder="e.g. Product Designer"
                required
                value={values.role}
              />
            </label>
          </div>
          <label>
            Job description
            <textarea
              maxLength={5000}
              onChange={(event) => update("description", event.target.value)}
              placeholder="What are the key responsibilities or requirements?"
              rows={3}
              value={values.description}
            />
          </label>
          <div className="form-row">
            <label>
              Company website
              <input
                onChange={(event) => update("website", event.target.value)}
                placeholder="https://company.com"
                type="url"
                value={values.website}
              />
            </label>
            <label>
              Job listing URL
              <input
                onChange={(event) => update("listingUrl", event.target.value)}
                placeholder="https://..."
                type="url"
                value={values.listingUrl}
              />
            </label>
          </div>

          <div className="form-section-label">ROLE &amp; STATUS</div>
          <div className="form-row form-row--three">
            <label>
              Location
              <input
                maxLength={100}
                onChange={(event) => update("location", event.target.value)}
                placeholder="City, country"
                value={values.location}
              />
            </label>
            <label>
              Work mode
              <select
                onChange={(event) => {
                  const selected = WORK_MODES.find((mode) => mode === event.target.value);
                  if (selected) update("workMode", selected);
                }}
                value={values.workMode}
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on-site">On-site</option>
              </select>
            </label>
            <label>
              Employment type
              <select
                onChange={(event) => {
                  const selected = EMPLOYMENT_TYPES.find((type) => type === event.target.value);
                  if (selected) update("employmentType", selected);
                }}
                value={values.employmentType}
              >
                <option value="internship">Internship</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
          </div>
          <div className="form-row form-row--three">
            <label>
              Salary range
              <input
                maxLength={80}
                onChange={(event) => update("salaryRange", event.target.value)}
                placeholder="e.g. $90k–$110k"
                value={values.salaryRange}
              />
            </label>
            <label>
              Application date <span className="required-mark">*</span>
              <input
                onChange={(event) => update("applicationDate", event.target.value)}
                required
                type="date"
                value={values.applicationDate}
              />
            </label>
            <label>
              Status
              <select
                onChange={(event) => {
                  const selected = APPLICATION_STATUSES.find(
                    (status) => status.value === event.target.value,
                  );
                  if (selected) update("status", selected.value);
                }}
                value={values.status}
              >
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>
          {values.status === "interview" && (
            <div className="form-row">
              <label>
                Interview date &amp; time
                <input
                  onChange={(event) => update("interviewAt", event.target.value)}
                  required
                  type="datetime-local"
                  value={values.interviewAt}
                />
              </label>
              <label>
                Interview type
                <select
                  onChange={(event) => update("interviewType", event.target.value)}
                  value={values.interviewType}
                >
                  <option>Video call</option>
                  <option>Phone screen</option>
                  <option>On-site interview</option>
                  <option>Portfolio review</option>
                </select>
              </label>
            </div>
          )}

          <div className="form-section-label">FOLLOW-UP &amp; NOTES</div>
          <div className="form-row">
            <label>
              Contact person
              <input
                autoComplete="name"
                maxLength={120}
                onChange={(event) => update("contactPerson", event.target.value)}
                placeholder="Name or email"
                value={values.contactPerson}
              />
            </label>
            <label>
              Next follow-up date
              <input
                onChange={(event) => update("followUpDate", event.target.value)}
                type="date"
                value={values.followUpDate}
              />
            </label>
          </div>
          <label>
            Tags
            <input
              onChange={(event) => update("tags", event.target.value)}
              placeholder="Product design, Series A (separate with commas)"
              value={values.tags}
            />
          </label>
          <label>
            Notes
            <textarea
              maxLength={5000}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Add your notes, reminders, or interview prep..."
              rows={3}
              value={values.notes}
            />
          </label>
          <div className="modal-actions">
            <button className="button button--secondary" disabled={saving} type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="button button--primary" disabled={saving} type="submit">
              {saving ? "Saving…" : application ? "Save changes" : "Add application"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
