import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { APPLICATION_STATUSES, type JobApplication } from "@/features/applications/types";

interface RecentApplicationsProps {
  applications: JobApplication[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function RecentApplications({ applications }: RecentApplicationsProps) {
  const recent = [...applications]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, 5);

  if (!recent.length) {
    return (
      <div className="empty-recent">
        <p>No applications yet</p>
        <span>Add your first opportunity to start tracking your search.</span>
      </div>
    );
  }

  return (
    <div className="recent-table-wrap">
      <table className="recent-table">
        <thead>
          <tr>
            <th scope="col">Company &amp; role</th>
            <th scope="col">Date added</th>
            <th scope="col">Status</th>
            <th scope="col"><span className="sr-only">Details</span></th>
          </tr>
        </thead>
        <tbody>
          {recent.map((application, index) => {
            const stage = APPLICATION_STATUSES.find((item) => item.value === application.status);
            return (
              <tr key={application.id}>
                <td>
                  <div className="company-cell">
                    <span className={`company-logo company-logo--${index % 5}`}>
                      {application.company.slice(0, 1)}
                    </span>
                    <span className="company-cell__text">
                      <strong>{application.company}</strong>
                      <span>{application.role}</span>
                    </span>
                  </div>
                </td>
                <td className="date-cell">
                  {formatDate(application.appliedAt ?? application.createdAt)}
                </td>
                <td>
                  <span className={`status-badge status-badge--${stage?.tone ?? "applied"}`}>
                    <span /> {stage?.label ?? "Applied"}
                  </span>
                </td>
                <td className="detail-cell">
                  <Link
                    to={`/applications/${application.id}`}
                    aria-label={`View ${application.company} application details`}
                  >
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
