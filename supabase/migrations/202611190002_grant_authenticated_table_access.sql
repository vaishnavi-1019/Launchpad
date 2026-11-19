grant select, insert, update, delete
  on table
    public.profiles,
    public.applications,
    public.saved_jobs,
    public.interview_preparations,
    public.skills,
    public.learning_resources,
    public.skill_job_sources
  to authenticated;
