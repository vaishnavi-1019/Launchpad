import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main className="route-status-page">
      <Link aria-label="Launchpad home" className="auth-brand" to="/">
        <span><BriefcaseBusiness size={19} /></span> launchpad
      </Link>
      <p className="route-status-code">404</p>
      <h1>This page isn’t here.</h1>
      <p>The link may be outdated, or the page may have moved.</p>
      <Link className="button button--primary" to="/">
        <ArrowLeft size={15} /> Back to overview
      </Link>
    </main>
  );
}
