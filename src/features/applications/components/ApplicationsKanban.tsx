import { useState, type DragEvent } from "react";
import { ArrowUpRight, GripVertical, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type JobApplication,
} from "../types";

interface ApplicationsKanbanProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
  onMove: (id: string, status: ApplicationStatus) => void;
}

export function ApplicationsKanban({
  applications,
  onEdit,
  onDelete,
  onMove,
}: ApplicationsKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  function handleDrop(event: DragEvent<HTMLElement>, status: ApplicationStatus) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggedId;
    if (id) onMove(id, status);
    setDraggedId(null);
  }

  return (
    <div className="kanban-board">
      {APPLICATION_STATUSES.map((status) => {
        const cards = applications.filter((application) => application.status === status.value);
        return (
          <section
            className={`kanban-column kanban-column--${status.tone}`}
            key={status.value}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, status.value)}
            aria-label={`${status.label} applications`}
          >
            <div className="kanban-column-heading">
              <span className={`pipeline-dot pipeline-dot--${status.tone}`} />
              <h2>{status.label}</h2>
              <span className="kanban-count">{cards.length}</span>
            </div>
            <div className="kanban-card-list">
              {cards.map((application) => (
                <article
                  className={`kanban-card${draggedId === application.id ? " kanban-card--dragging" : ""}`}
                  draggable
                  key={application.id}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", application.id);
                    event.dataTransfer.effectAllowed = "move";
                    setDraggedId(application.id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <div className="kanban-card-top">
                    <span className={`company-logo company-logo--${application.company.length % 5}`}>
                      {application.company.slice(0, 1)}
                    </span>
                    <GripVertical className="kanban-grip" size={15} />
                  </div>
                  <Link className="kanban-company" to={`/applications/${application.id}`}>
                    {application.company} <ArrowUpRight size={12} />
                  </Link>
                  <p className="kanban-role">{application.role}</p>
                  <div className="kanban-card-meta">
                    {application.location && <span>{application.location}</span>}
                    <span>{application.applicationDate ?? "Date not set"}</span>
                  </div>
                  {application.tags.length > 0 && (
                    <div className="tag-list tag-list--compact">
                      {application.tags.slice(0, 2).map((tag) => (
                        <span className="application-tag" key={tag}>{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="kanban-card-footer">
                    <label className="kanban-move-label">
                      <span className="sr-only">Move {application.company} to another status</span>
                      <select
                        aria-label={`Move ${application.company} to another status`}
                        onChange={(event) => {
                          const nextStatus = APPLICATION_STATUSES.find(
                            (item) => item.value === event.target.value,
                          );
                          if (nextStatus) onMove(application.id, nextStatus.value);
                        }}
                        value={application.status}
                      >
                        {APPLICATION_STATUSES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </label>
                    <div className="kanban-actions">
                      <button
                        className="row-action"
                        onClick={() => onEdit(application)}
                        type="button"
                        aria-label={`Edit ${application.company}`}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        className="row-action row-action--delete"
                        onClick={() => onDelete(application)}
                        type="button"
                        aria-label={`Delete ${application.company}`}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              {cards.length === 0 && (
                <div className="kanban-column-empty">Drop an application here</div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
