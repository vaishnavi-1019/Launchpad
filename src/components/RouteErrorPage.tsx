import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";

export function RouteErrorPage() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="route-status-page">
      <Link aria-label="Launchpad home" className="auth-brand" to="/">
        <span><BriefcaseBusiness size={19} /></span> launchpad
      </Link>
      <p className="route-status-code">{notFound ? "404" : "Something went wrong"}</p>
      <h1>{notFound ? "This page isn’t here." : "We couldn’t load this page."}</h1>
      <p>
        {notFound
          ? "The link may be outdated, or the page may have moved."
          : "Try again, or return to your Launchpad overview."}
      </p>
      <Link className="button button--primary" to="/">
        <ArrowLeft size={15} /> Back to overview
      </Link>
    </main>
  );
}
