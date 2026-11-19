import { ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { APPLICATION_STATUSES, type JobApplication } from "../types";

interface ApplicationsTableProps {
  applications: JobApplication[];
  onEdit: (application: JobApplication) => void;
  onDelete: (application: JobApplication) => void;
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  return new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ApplicationsTable({
  applications,
  onEdit,
  onDelete,
}: ApplicationsTableProps) {
  return (
    <div
      aria-label="Scrollable applications table"
      className="management-table-wrap"
      tabIndex={0}
    >
      <table className="management-table">
        <thead>
          <tr>
            <th scope="col">Company &amp; role</th>
            <th scope="col">Location</th>
            <th scope="col">Work mode</th>
            <th scope="col">Date applied</th>
            <th scope="col">Status</th>
            <th scope="col">Follow-up</th>
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {applications.map((application, index) => {
            const status = APPLICATION_STATUSES.find(
              (item) => item.value === application.status,
            );
            return (
              <tr key={application.id}>
                <td>
                  <div className="company-cell">
                    <span className={`company-logo company-logo--${index % 5}`}>
                      {application.company.slice(0, 1)}
                    </span>
                    <span className="company-cell__text">
                      <Link className="table-company-link" to={`/applications/${application.id}`}>
                        {application.company}
                      </Link>
                      <span>{application.role}</span>
                    </span>
                  </div>
                </td>
                <td>{application.location || "—"}</td>
                <td className="capitalize-cell">{application.workMode ?? "—"}</td>
                <td className="date-cell">{formatDate(application.applicationDate ?? application.appliedAt?.slice(0, 10))}</td>
                <td>
                  <span className={`status-badge status-badge--${status?.tone ?? "applied"}`}>
                    <span /> {status?.label ?? "Applied"}
                  </span>
                </td>
                <td className="date-cell">{formatDate(application.followUpDate)}</td>
                <td>
                  <div className="row-actions">
                    <Link
                      className="row-action"
                      to={`/applications/${application.id}`}
                      aria-label={`View ${application.company} details`}
                      title="View details"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                    <button
                      className="row-action"
                      onClick={() => onEdit(application)}
                      type="button"
                      aria-label={`Edit ${application.company}`}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="row-action row-action--delete"
                      onClick={() => onDelete(application)}
                      type="button"
                      aria-label={`Delete ${application.company}`}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
