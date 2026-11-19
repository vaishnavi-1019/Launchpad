import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Compass, LayoutDashboard, ScanSearch, Target, TrendingUp } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

export function Sidebar() {
  return (
    <aside className="app-sidebar" aria-label="Main navigation">
      <Link className="brand" to="/">
        <span className="brand-mark">L</span>
        <span>launchpad</span>
      </Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="sidebar-nav">
        <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to="/">
          <LayoutDashboard size={17} /> Overview
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
          to="/job-discovery"
        >
          <Compass size={17} /> Discover jobs
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
          to="/match-analyzer"
        >
          <ScanSearch size={17} /> Match analyzer
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
          to="/applications"
        >
          <BriefcaseBusiness size={17} /> Applications
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
          to="/interview-prep"
        >
          <CalendarDays size={17} /> Interview prep
        </NavLink>
        <NavLink
          className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
          to="/skill-gap"
        >
          <TrendingUp size={17} /> Skill roadmap
        </NavLink>
        <Link className="nav-link" to="/#weekly-goal"><Target size={17} /> Weekly goals</Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <span className="sidebar-tip__icon"><ArrowUpRight size={15} /></span>
          <strong>Small steps, big things.</strong>
          <p>Your next opportunity is closer than you think.</p>
        </div>
        <div className="sidebar-user">
          <span className="avatar">A</span>
          <span><strong>Alex Morgan</strong><small>Personal workspace</small></span>
        </div>
      </div>
    </aside>
  );
}
