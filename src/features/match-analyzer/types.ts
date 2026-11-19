export interface MatchAnalyzerInput {
  resumeText: string;
  jobDescription: string;
}

export interface MatchAnalyzerResult {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperienceKeywords: string[];
  importantKeywords: string[];
  recommendedSkills: string[];
  improvementChecklist: string[];
  resumeKeywordSuggestions: string[];
  evaluatedSkillCount: number;
  evaluatedKeywordCount: number;
}
