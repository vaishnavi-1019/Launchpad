# Launchpad portfolio kit

## Short project explanation

> Launchpad is a responsive job-search workspace I built with React,
> TypeScript, and Vite. It brings application tracking, mock job discovery,
> interview preparation, and skill planning into one interface. I focused on
> reusable feature components, typed service boundaries, local persistence,
> accessible interactions, and a staged Supabase integration. The job-match
> screen is an explicitly labeled deterministic demo, not an AI claim.

Adjust the description to match your own contribution and the version you
actually demonstrate.

## Portfolio project description

**Launchpad — Job Search Workspace**

Designed and developed a responsive frontend workspace that helps organize a
job search across applications, saved listings, interviews, and learning goals.
Built the interface with React and TypeScript, separated feature UI from service
logic, and used browser storage for the local demo experience. Added a
deterministic resume-to-job keyword comparison and prepared a Supabase
authentication, profile, and RLS-backed data layer as a staged migration.

**Highlights**

- Application dashboard, CRUD tracker, table/Kanban views, search, filters,
  activity history, and detail routes.
- Mock job discovery with combined filters and saved listings.
- Interview preparation workspaces linked to application IDs.
- Skill roadmap with progress calculations and saved-job skill comparison.
- Keyboard-aware dialogs, responsive layout checks, and focused automated tests.

**Stack:** React, TypeScript, Vite, React Router, Recharts, Supabase, Vitest,
Testing Library, ESLint.

Do not add user counts, performance improvements, production claims, or business
outcomes unless you measure and verify them.

## Discussing AI assistance honestly

Suggested wording (edit it to reflect what you actually did):

> I used an AI coding assistant during development to help explore
> implementation options, draft and refine code, and identify areas to test. I
> reviewed the changes, made product and implementation decisions, and ran the
> project’s tests, lint, build, and browser checks. The match analyzer is
> deterministic keyword matching; it does not call an AI model. I do not claim
> AI-generated code as an autonomous or production-validated feature.

Be prepared to point to a specific decision or bug you personally investigated,
how you checked the generated suggestions, and what you would change with more
time. Only describe tasks you actually performed.

## Technical interview questions

1. How is the application model shared between the dashboard, tracker, and
   details route without creating multiple sources of truth?
2. What belongs in a feature service versus a React component, and how does
   that boundary help a future backend migration?
3. How does the application search/filter/sort pipeline work? Why are the
   filters combined with AND semantics?
4. How would you prevent a stale local-storage write from overwriting a newer
   application update?
5. How are saved job listings represented separately from tracked
   applications, and how do you avoid duplicate tracker entries?
6. How are interview-preparation records linked to applications? What should
   happen if their application is deleted?
7. Explain the required-skill progress calculation and the difference between
   “have”, “learning”, “to learn”, and “completed”.
8. How does the demo match score work? What are its limitations compared with
   semantic matching or a real language model?
9. Why must a future AI analyzer call a server-side endpoint rather than expose
   an API secret in Vite client variables?
10. How does Supabase Row Level Security complement frontend route guards?
    Why are route guards alone not an authorization boundary?
11. Which database relationships ensure interview prep, skills, and saved-job
    sources belong to the same user?
12. What production checks would you run to validate that two Supabase users
    cannot see each other’s records?
13. How do you manage focus when a modal opens, traps keyboard navigation, and
    closes?
14. How did you measure mobile overflow and verify that the table remains
    keyboard-scrollable?
15. What is covered by the current automated tests, and what should be added
    before a production release?
16. How does the Vercel SPA rewrite support direct navigation to a nested
    React Router route?
17. How would you add end-to-end tests for signup, application CRUD, persistence,
    and error states without using real user data?
18. Which parts of the product are currently local/mock and what migration
    sequence would you use to move them to Supabase safely?

## Suggested answer for “What would you improve next?”

> I would finish the backend migration feature by feature rather than switch all
> screens at once. I would add integration and end-to-end tests around the
> Supabase services and RLS using isolated test users, then verify production
> email redirects, loading/error states, and data migration. I would also add
> accessibility automation and test the application at a broader range of
> browsers and viewport sizes.
