import type { MatchAnalyzerInput, MatchAnalyzerResult } from "../types";

const SKILL_CATALOG = [
  { name: "Accessibility", aliases: ["accessibility", "wcag", "a11y"] },
  { name: "Agile", aliases: ["agile", "scrum"] },
  { name: "AWS", aliases: ["aws", "amazon web services"] },
  { name: "Communication", aliases: ["communication", "written communication"] },
  { name: "CSS", aliases: ["css", "css3"] },
  { name: "Data analysis", aliases: ["data analysis", "data analytics"] },
  { name: "Design systems", aliases: ["design systems", "design system"] },
  { name: "Docker", aliases: ["docker", "containerization"] },
  { name: "Figma", aliases: ["figma"] },
  { name: "Git", aliases: ["git", "version control"] },
  { name: "HTML", aliases: ["html", "html5"] },
  { name: "JavaScript", aliases: ["javascript", "js", "ecmascript"] },
  { name: "Machine learning", aliases: ["machine learning", "ml"] },
  { name: "Node.js", aliases: ["node.js", "nodejs"] },
  { name: "Product design", aliases: ["product design", "product designer"] },
  { name: "Project management", aliases: ["project management", "project planning"] },
  { name: "Prototyping", aliases: ["prototyping", "prototypes", "prototype"] },
  { name: "Python", aliases: ["python"] },
  { name: "React", aliases: ["react", "react.js", "reactjs"] },
  { name: "REST APIs", aliases: ["rest api", "rest apis", "restful api", "restful apis"] },
  { name: "SQL", aliases: ["sql", "postgresql", "mysql"] },
  { name: "Stakeholder management", aliases: ["stakeholder management", "stakeholder communication"] },
  { name: "TypeScript", aliases: ["typescript", "ts"] },
  { name: "User research", aliases: ["user research", "usability testing", "user interviews"] },
];

const STOP_WORDS = new Set(
  [
    "about", "across", "after", "also", "and", "are", "as", "at", "be", "because",
    "been", "being", "both", "but", "by", "can", "candidate", "candidates", "clear",
    "closely", "company", "create", "design", "do", "each", "end", "etc", "experience",
    "for", "from", "full", "get", "good", "have", "help", "how", "in", "including",
    "into", "is", "it", "its", "job", "join", "looking", "make", "more", "most",
    "new", "of", "on", "or", "our", "own", "people", "role", "team", "that", "the",
    "their", "them", "there", "these", "this", "through", "to", "understanding", "up",
    "use", "using", "various", "we", "well", "what", "when", "which", "who", "will",
    "with", "work", "you", "your",
  ],
);

const MAX_IMPORTANT_KEYWORDS = 8;

function containsTerm(text: string, term: string): boolean {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escapedTerm}(?=$|[^a-z0-9])`, "i").test(text);
}

function findKeywords(text: string): string[] {
  const counts = new Map<string, { count: number; firstIndex: number }>();
  const pattern = /[a-z][a-z0-9+#.-]{2,}/gi;
  for (const match of text.matchAll(pattern)) {
    const word = match[0].toLocaleLowerCase().replace(/[.-]+$/g, "");
    if (word.length < 3 || STOP_WORDS.has(word) || /^\d+$/.test(word)) continue;
    const previous = counts.get(word);
    counts.set(word, {
      count: (previous?.count ?? 0) + 1,
      firstIndex: previous?.firstIndex ?? match.index ?? 0,
    });
  }

  return [...counts.entries()]
    .sort(
      ([, first], [, second]) =>
        second.count - first.count || first.firstIndex - second.firstIndex,
    )
    .slice(0, MAX_IMPORTANT_KEYWORDS)
    .map(([word]) => word);
}

function findMentionedSkills(text: string): string[] {
  return SKILL_CATALOG
    .filter((skill) => skill.aliases.some((alias) => containsTerm(text, alias)))
    .map((skill) => skill.name);
}

function makeImprovementChecklist(
  matchedSkills: string[],
  missingSkills: string[],
  missingKeywords: string[],
): string[] {
  const checklist = [
    matchedSkills.length > 0
      ? `Add a concrete resume example showing how you used ${matchedSkills.slice(0, 2).join(" and ")}.`
      : "Add a specific project or accomplishment that demonstrates skills relevant to this role.",
    "Quantify a result where possible, such as time saved, users reached, or a measurable improvement.",
  ];

  if (missingSkills.length > 0) {
    checklist.push(
      `Check whether you have honest examples for ${missingSkills.slice(0, 2).join(" and ")}; include them only if they reflect your experience.`,
    );
  } else {
    checklist.push("Keep your strongest role-related skills visible near the top of your resume.");
  }

  checklist.push(
    missingKeywords.length > 0
      ? `Use relevant job-description language naturally, such as “${missingKeywords.slice(0, 2).join("” and “")},” when it accurately describes your work.`
      : "Tailor your opening summary to the responsibilities and outcomes described in the posting.",
  );
  checklist.push("Make the connection between your projects, responsibilities, and this role easy to scan.");
  return checklist;
}

export function analyzeJobMatch(input: MatchAnalyzerInput): MatchAnalyzerResult {
  const resumeText = input.resumeText.trim();
  const jobDescription = input.jobDescription.trim();
  const requiredSkills = findMentionedSkills(jobDescription);
  const resumeSkills = new Set(findMentionedSkills(resumeText));
  const matchedSkills = requiredSkills.filter((skill) => resumeSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkills.has(skill));
  const importantKeywords = findKeywords(jobDescription);
  const relevantExperienceKeywords = importantKeywords.filter((keyword) =>
    containsTerm(resumeText, keyword),
  );
  const missingKeywords = importantKeywords.filter(
    (keyword) => !relevantExperienceKeywords.includes(keyword),
  );

  const skillCoverage = requiredSkills.length
    ? matchedSkills.length / requiredSkills.length
    : null;
  const keywordCoverage = importantKeywords.length
    ? relevantExperienceKeywords.length / importantKeywords.length
    : null;
  const matchPercentage =
    skillCoverage !== null && keywordCoverage !== null
      ? Math.round((skillCoverage * 0.7 + keywordCoverage * 0.3) * 100)
      : Math.round((skillCoverage ?? keywordCoverage ?? 0) * 100);

  return {
    matchPercentage,
    matchedSkills,
    missingSkills,
    relevantExperienceKeywords,
    importantKeywords,
    recommendedSkills: missingSkills,
    improvementChecklist: makeImprovementChecklist(
      matchedSkills,
      missingSkills,
      missingKeywords,
    ),
    resumeKeywordSuggestions: missingKeywords,
    evaluatedSkillCount: requiredSkills.length,
    evaluatedKeywordCount: importantKeywords.length,
  };
}
