import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  CircleAlert,
  FileText,
  Lightbulb,
  LoaderCircle,
  RotateCcw,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import { analyzeJobMatch } from "../services/demoMatchAnalyzer";
import type { MatchAnalyzerResult } from "../types";

const SAMPLE_RESUME = `Product design student with experience creating accessible web and mobile experiences. Skilled in Figma, user research, prototyping, design systems, and HTML/CSS.

Selected project: Led usability testing with 12 students and redesigned a course-planning flow. Built interactive prototypes, partnered with two developers, and improved task completion by 24%.

Campus design club: Collaborated in an Agile team, presented design decisions to stakeholders, and documented reusable interface patterns.`;

const SAMPLE_JOB_DESCRIPTION = `We're looking for an early-career Product Designer to help improve our collaborative learning platform. You will work closely with product managers and engineers to turn user research into thoughtful experiences.

Responsibilities include prototyping new workflows in Figma, maintaining our design systems, and partnering with engineers to build accessible interfaces using HTML and CSS. You will plan usability testing, communicate design decisions to stakeholders, and work in an Agile team.

Strong written communication and experience with data analysis are a plus.`;

function ResultList({
  items,
  emptyMessage,
  tone,
}: {
  items: string[];
  emptyMessage: string;
  tone: "positive" | "neutral";
}) {
  if (items.length === 0) {
    return <p className="match-empty-note">{emptyMessage}</p>;
  }

  return (
    <ul className={`match-chip-list match-chip-list--${tone}`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function AnalysisResults({ result }: { result: MatchAnalyzerResult }) {
  const hasTerms = result.evaluatedSkillCount + result.evaluatedKeywordCount > 0;
  const scoreMessage = !hasTerms
    ? "No recognizable skills or keywords were found. Try adding more detail to both texts."
    : result.matchPercentage >= 70
      ? "Your resume already reflects several signals this role asks for."
      : result.matchPercentage >= 40
        ? "There are some relevant signals here, with a few areas to strengthen."
        : "Use the comparison below to identify relevant experience to make clearer.";

  return (
    <section aria-labelledby="match-results-heading" className="match-results">
      <div className="match-results-heading">
        <div>
          <div className="match-eyebrow"><Target size={14} /> YOUR DEMO RESULTS</div>
          <h2 id="match-results-heading">A clearer view of your fit</h2>
          <p>Use this as a starting point for tailoring your resume, not as a hiring prediction.</p>
        </div>
        <span className="match-demo-tag">DEMO ANALYSIS</span>
      </div>

      <div className="match-score-panel">
        <div
          aria-label={`Keyword match score: ${result.matchPercentage} percent`}
          className="match-score-ring"
          role="img"
          style={{
            background: `conic-gradient(#675be0 ${result.matchPercentage * 3.6}deg, #ecebf5 0deg)`,
          }}
        >
          <div className="match-score-center">
            <strong>{result.matchPercentage}%</strong>
            <span>match</span>
          </div>
        </div>
        <div className="match-score-copy">
          <span className="match-score-kicker">KEYWORD OVERLAP</span>
          <h3>{scoreMessage}</h3>
          <p>
            Compared {result.evaluatedSkillCount} recognized job skills and{" "}
            {result.evaluatedKeywordCount} job-description keywords. The demo score
            weights skills at 70% and keyword overlap at 30% when both are available.
            It uses a limited skill catalog and exact terms, so context and synonyms
            can be missed.
          </p>
        </div>
        <div className="match-score-stat">
          <span><Check size={14} /> Skills matched</span>
          <strong>{result.matchedSkills.length}<small> / {result.evaluatedSkillCount}</small></strong>
        </div>
        <div className="match-score-stat">
          <span><FileText size={14} /> Keywords found</span>
          <strong>{result.relevantExperienceKeywords.length}<small> / {result.evaluatedKeywordCount}</small></strong>
        </div>
      </div>

      <div className="match-result-grid">
        <section className="match-result-panel">
          <div className="match-panel-heading">
            <span className="match-panel-icon match-panel-icon--good"><Check size={16} /></span>
            <div><h3>Skills in common</h3><p>Recognized in both texts</p></div>
            <span className="match-count">{result.matchedSkills.length}</span>
          </div>
          <ResultList
            items={result.matchedSkills}
            emptyMessage="No catalog skills were found in both texts yet."
            tone="positive"
          />
        </section>

        <section className="match-result-panel">
          <div className="match-panel-heading">
            <span className="match-panel-icon match-panel-icon--missing"><CircleAlert size={16} /></span>
            <div><h3>Missing skills</h3><p>In the job description, not detected in your resume</p></div>
            <span className="match-count">{result.missingSkills.length}</span>
          </div>
          <ResultList
            items={result.missingSkills}
            emptyMessage="All recognized job skills also appear in your resume."
            tone="neutral"
          />
          {result.recommendedSkills.length > 0 && (
            <p className="match-caution">
              Consider learning these only if they fit your goals; never list a skill you can’t support.
            </p>
          )}
        </section>

        <section className="match-result-panel">
          <div className="match-panel-heading">
            <span className="match-panel-icon match-panel-icon--keywords"><Search size={16} /></span>
            <div><h3>Job description keywords</h3><p>Important terms and whether they appear in your resume</p></div>
          </div>
          <ul className="match-keyword-list">
            {result.importantKeywords.length > 0 ? result.importantKeywords.map((keyword) => {
              const found = result.relevantExperienceKeywords.includes(keyword);
              return (
                <li key={keyword} className={found ? "match-keyword match-keyword--found" : "match-keyword"}>
                  <span>{keyword}</span>
                  <small>{found ? "Found" : "Not found"}</small>
                </li>
              );
            }) : <li className="match-empty-note">No important keywords could be extracted from this description.</li>}
          </ul>
        </section>

        <section className="match-result-panel">
          <div className="match-panel-heading">
            <span className="match-panel-icon match-panel-icon--keywords"><BriefcaseBusiness size={16} /></span>
            <div><h3>Relevant experience detected</h3><p>Keywords already present in your resume</p></div>
          </div>
          <ResultList
            items={result.relevantExperienceKeywords}
            emptyMessage="No selected job-description keywords were found in your resume."
            tone="positive"
          />
        </section>
      </div>

      <div className="match-action-grid">
        <section className="match-action-panel">
          <div className="match-action-heading">
            <span className="match-panel-icon match-panel-icon--plan"><BookOpenCheck size={16} /></span>
            <div><h3>Your improvement checklist</h3><p>Practical edits to consider before applying</p></div>
          </div>
          <ol className="match-checklist">
            {result.improvementChecklist.map((item, index) => (
              <li key={item}><span>{String(index + 1).padStart(2, "0")}</span><p>{item}</p></li>
            ))}
          </ol>
        </section>

        <section className="match-action-panel">
          <div className="match-action-heading">
            <span className="match-panel-icon match-panel-icon--missing"><Lightbulb size={16} /></span>
            <div><h3>Recommended skills to learn</h3><p>Areas the role mentions that your resume doesn’t</p></div>
          </div>
          <ResultList
            items={result.recommendedSkills}
            emptyMessage="No recognized job skills are missing from your resume."
            tone="neutral"
          />
          <p className="match-suggestion-note">
            Treat these as options for future learning, not requirements or claims about your current abilities.
          </p>
        </section>

        <section className="match-action-panel match-suggestions-panel">
          <div className="match-action-heading">
            <span className="match-panel-icon match-panel-icon--suggest"><Lightbulb size={16} /></span>
            <div><h3>Resume keyword suggestions</h3><p>Use only when they honestly describe your experience</p></div>
          </div>
          <ResultList
            items={result.resumeKeywordSuggestions}
            emptyMessage="Your resume already includes the selected important job keywords."
            tone="neutral"
          />
          <p className="match-suggestion-note">
            Add context and evidence around relevant terms rather than inserting keywords without proof.
          </p>
        </section>
      </div>
    </section>
  );
}

export function MatchAnalyzerPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<MatchAnalyzerResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  function loadSample() {
    setResumeText(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
    setResult(null);
    setValidationMessage("");
  }

  function clearInputs() {
    setResumeText("");
    setJobDescription("");
    setResult(null);
    setValidationMessage("");
  }

  function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resumeText.trim() || !jobDescription.trim()) {
      setValidationMessage("Add both your resume text and a job description to compare them.");
      return;
    }

    setValidationMessage("");
    setResult(null);
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setResult(analyzeJobMatch({ resumeText, jobDescription }));
      setIsAnalyzing(false);
    }, 750);
  }

  return (
    <div className="match-analyzer-page">
      <header className="match-page-heading">
        <div>
          <div className="match-eyebrow"><Sparkles size={14} /> CAREER TOOLKIT</div>
          <h1>Understand your job fit.</h1>
          <p>Compare your resume with a role and find practical ways to tailor your application.</p>
        </div>
        <div className="match-heading-mark" aria-hidden="true"><Target size={24} /></div>
      </header>

      <aside className="match-demo-notice" aria-label="About this demo analyzer">
        <span className="match-notice-icon"><CircleAlert size={17} /></span>
        <div>
          <strong>Demo analyzer · deterministic keyword matching</strong>
          <p>No AI model or external service is used. Your text is analyzed in this browser and is not sent to a server.</p>
        </div>
      </aside>

      <form className="match-input-form" onSubmit={handleAnalyze}>
        <div className="match-input-heading">
          <div><h2>Bring your resume and a job description</h2><p>Paste text to see a transparent, local comparison.</p></div>
          <div className="match-input-actions">
            <button className="match-text-button" onClick={loadSample} type="button" disabled={isAnalyzing}>
              <Sparkles size={14} /> Load sample
            </button>
            <button className="match-text-button" onClick={clearInputs} type="button" disabled={isAnalyzing}>
              <RotateCcw size={14} /> Clear
            </button>
          </div>
        </div>

        <div className="match-input-grid">
          <label className="match-text-field" htmlFor="resume-text">
            <span className="match-field-heading"><span><FileText size={15} /> Resume text</span><small>{resumeText.length.toLocaleString()} characters</small></span>
            <textarea
              id="resume-text"
              onChange={(event) => {
                setResumeText(event.target.value);
                setResult(null);
                setValidationMessage("");
              }}
              placeholder="Paste your resume text here — include skills, projects, and experience..."
              value={resumeText}
              disabled={isAnalyzing}
            />
            <span className="match-field-help">Include project details and outcomes for more useful suggestions.</span>
          </label>
          <label className="match-text-field" htmlFor="job-description">
            <span className="match-field-heading"><span><BriefcaseBusiness size={15} /> Job description</span><small>{jobDescription.length.toLocaleString()} characters</small></span>
            <textarea
              id="job-description"
              onChange={(event) => {
                setJobDescription(event.target.value);
                setResult(null);
                setValidationMessage("");
              }}
              placeholder="Paste the job description here — responsibilities and qualifications..."
              value={jobDescription}
              disabled={isAnalyzing}
            />
            <span className="match-field-help">Include the full description to compare a wider set of terms.</span>
          </label>
        </div>

        {validationMessage && <p className="match-validation" role="alert">{validationMessage}</p>}
        <div className="match-submit-row">
          <span><CircleAlert size={14} /> Demo guidance only — not an assessment of your chances.</span>
          <button className="button button--primary match-analyze-button" type="submit" disabled={isAnalyzing}>
            {isAnalyzing
              ? <><LoaderCircle className="match-loading-icon" size={16} /> Comparing text…</>
              : <>Analyze match <ArrowRight size={16} /></>}
          </button>
        </div>
      </form>

      {isAnalyzing && (
        <div className="match-loading-panel" role="status" aria-live="polite">
          <span className="match-loading-orbit"><Sparkles size={17} /></span>
          <div><strong>Comparing your text</strong><p>Checking skills and important job-description keywords…</p></div>
          <div className="match-loading-bars" aria-hidden="true"><i /><i /><i /></div>
        </div>
      )}

      {result ? (
        <AnalysisResults result={result} />
      ) : !isAnalyzing ? (
        <section className="match-empty-state">
          <div className="match-empty-art"><FileText size={23} /><span><Target size={19} /></span></div>
          <h2>Your match breakdown will appear here</h2>
          <p>Paste your text or load the sample to explore skills, keywords, and next steps.</p>
        </section>
      ) : null}
    </div>
  );
}
