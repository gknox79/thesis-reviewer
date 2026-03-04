/**
 * Generate an AI logbook entry for TiSEM compliance.
 * Students must document AI tool usage per TiSEM 2025-26 assessment policy.
 */

export interface LogbookData {
  filename: string
  stage: string
  criteriaReviewed: string[]
  date: string
}

export function generateLogbookEntry(data: LogbookData): string {
  const criteria = data.criteriaReviewed.length > 0
    ? data.criteriaReviewed.join(', ')
    : 'All applicable criteria based on submitted content'

  return `AI TOOL LOGBOOK ENTRY
=====================

Date: ${data.date}
Tool: Thesis Draft Reviewer (Anthropic Claude API, Sonnet model)
Purpose: Received structured formative feedback on thesis chapter

File reviewed: ${data.filename}
Submission stage: ${data.stage}
Criteria covered: ${criteria}

Nature of feedback received:
- Strengths and areas for improvement per rubric criterion
- Cross-check findings (consistency, unsupported claims, etc.)
- Suggested priority actions
- Questions to discuss with supervisor

Action taken by student:
[Fill in what you did with the feedback — e.g., revised section 2.3,
restructured hypotheses, added missing citations, discussed X with supervisor]

-----
Note: This tool provides formative feedback only. It does not produce grades,
scores, or replacement text. The student is responsible for all writing and
revisions. This entry is generated automatically for AI logbook compliance
per TiSEM assessment policy 2025-26.
`
}

export function getCriteriaForStage(stage: string): string[] {
  switch (stage) {
    case 'proposal':
      return [
        '1. Problem Introduction & Research Question (15%)',
        '2. Theory (20%)',
        '3. Method & Analysis — design only (20%)',
        '6a. Argumentation & Consistency (10%)',
        '6b. Style & Structure (5%)',
      ]
    case 'draft':
      return [
        '1. Problem Introduction & Research Question (15%)',
        '2. Theory (20%)',
        '3. Method & Analysis (20%)',
        '4. Findings & Discussion (15%)',
        '5. Conclusions & Recommendations (15%)',
        '6a. Argumentation & Consistency (10%)',
        '6b. Style & Structure (5%)',
      ]
    case 'final':
      return [
        '1. Problem Introduction & Research Question (15%)',
        '2. Theory (20%)',
        '3. Method & Analysis (20%)',
        '4. Findings & Discussion (15%)',
        '5. Conclusions & Recommendations (15%)',
        '6a. Argumentation & Consistency (10%)',
        '6b. Style & Structure (5%)',
      ]
    default:
      return []
  }
}
