import type { Project } from "@/lib/schema";
import { fold } from "@/lib/text";

export type Stats = {
  total: number;
  live: number;
  building: number;
  flagged: number;
  visible: number;
};

function haystack(project: Project): string {
  return [
    project.name,
    project.team,
    project.categories.join(" "),
    project.status,
    project.realm,
    project.alsoPath,
    project.docs,
    project.notes,
    project.website,
    project.github,
    project.x,
    project.oneLiner,
    project.id,
    project.riskNote,
  ].join("\n");
}

export function teamParts(team: string): string[] {
  return team
    .split("/")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function filterProjects(
  projects: Project[],
  query: string,
  category: string,
  flaggedOnly: boolean,
  verifiedOnly: boolean,
  team = "",
): Project[] {
  const needle = fold(query.trim());
  const matched: Project[] = [];
  for (const project of projects) {
    if (category !== "All" && !project.categories.includes(category)) continue;
    if (team && !teamParts(project.team).includes(team)) continue;
    if (flaggedOnly && !project.riskFlag) continue;
    if (verifiedOnly && !project.verified) continue;
    if (needle && !fold(haystack(project)).includes(needle)) continue;
    matched.push(project);
  }
  return matched;
}

export function summarize(projects: Project[], visible: number): Stats {
  let live = 0;
  let building = 0;
  let flagged = 0;
  for (const project of projects) {
    if (project.status === "Live") live += 1;
    else if (project.status === "Beta" || project.status === "Alpha" || project.status === "Dev") building += 1;
    if (project.riskFlag) flagged += 1;
  }
  return { total: projects.length, live, building, flagged, visible };
}

function byScore(a: Project, b: Project): number {
  return b.score - a.score || a.name.localeCompare(b.name, "en");
}

export function categoryRows(
  labels: readonly string[],
  projects: Project[],
  category: string,
): Array<{ category: string; projects: Project[] }> {
  const sorted = projects.slice().sort(byScore);
  const wanted = category === "All" ? labels : labels.filter((item) => item === category);
  const rows: Array<{ category: string; projects: Project[] }> = [];
  for (const label of wanted) {
    const list = sorted.filter((project) => project.categories.includes(label));
    if (list.length === 0) continue;
    rows.push({ category: label, projects: list });
  }
  return rows;
}
