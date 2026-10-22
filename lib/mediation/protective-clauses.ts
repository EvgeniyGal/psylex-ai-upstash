export type ProtectiveClause = {
  id: string;
  /** Dispute tags that auto-suggest this clause (pre-checked). Empty = never auto. */
  tags: string[];
  en: string;
  uk: string;
};

/** Standard protective clauses for neighbor / boundary / vegetation disputes. */
export const PROTECTIVE_CLAUSES: ProtectiveClause[] = [
  {
    id: "moratorium_until_survey",
    tags: ["boundary_vegetation", "default"],
    en: "Until the survey is completed and its results are accepted, neither party shall cut, prune, remove, transplant, or otherwise disturb the disputed tree or vegetation.",
    uk: "До завершення межевання і прийняття його результатів жодна зі сторін не має права зрубувати, обрізати, пересаджувати чи іншим чином турбувати спірне дерево чи рослинність.",
  },
  {
    id: "no_boundary_works_without_consent",
    tags: ["boundary_vegetation", "default"],
    en: "Neither party shall plant trees or shrubs or construct structures near the shared boundary without the prior written consent of the other party.",
    uk: "Жодна зі сторін не садитиме дерева чи кущі та не зводитиме споруди біля спільної межі без попередньої письмової згоди іншої сторони.",
  },
  {
    id: "survey_binding",
    tags: ["boundary_vegetation", "default"],
    en: "Both parties shall treat the independent survey results as binding for resolving the boundary location dispute between them.",
    uk: "Обидві сторони вважатимуть результати незалежного межевання обов’язковими для визначення спірної межі між ними.",
  },
  {
    id: "mutual_surveyor_selection",
    tags: ["boundary_vegetation"],
    en: "Both parties shall jointly select a qualified independent surveyor; neither party shall unilaterally appoint the surveyor.",
    uk: "Обидві сторони спільно оберуть кваліфікованого незалежного геодезиста; жодна зі сторін не призначатиме геодезиста одноосібно.",
  },
];

export function protectiveClauseText(clause: ProtectiveClause, locale: "en" | "uk" = "en") {
  return locale === "uk" ? clause.uk : clause.en;
}

export function suggestedProtectiveClauseIds(tags: string[] = ["default"]) {
  const set = new Set(tags);
  return PROTECTIVE_CLAUSES.filter((clause) =>
    clause.tags.some((tag) => set.has(tag) || tag === "default"),
  ).map((clause) => clause.id);
}

/** Heuristic tags from room title / dispute text for auto-suggest. */
export function inferDisputeTags(text: string | null | undefined): string[] {
  const hay = (text ?? "").toLowerCase();
  if (
    /\b(tree|maple|oak|fence|boundary|survey|property line|межа|дерев|огорож|межуван)\b/.test(
      hay,
    )
  ) {
    return ["boundary_vegetation", "default"];
  }
  return ["default"];
}
