/** Shared, deterministic people for the Angular and Vue assistant workspaces. */
export interface AgentPerson {
  id: string;
  name: string;
  salary: number;
  team: string;
  status: string;
  started: string;
}
const names = [
  "Ada Lovelace",
  "Grace Hopper",
  "Katherine Johnson",
  "Alan Turing",
  "Margaret Hamilton",
  "Barbara Liskov",
  "Donald Knuth",
  "Linus Torvalds",
  "Edsger Dijkstra",
  "Tim Berners-Lee",
  "Radia Perlman",
  "James Gosling",
  "Frances Allen",
  "Guido van Rossum",
  "Mary Jackson",
];
const ids = [
  "ada",
  "grace",
  "katherine",
  "alan",
  "margaret",
  "barbara",
  "donald",
  "linus",
  "edsger",
  "tim",
  "radia",
  "james",
  "frances",
  "guido",
  "mary",
];
export const AGENT_PEOPLE: readonly AgentPerson[] = names.map(
  (name, index) => ({
    id: ids[index] ?? String(index),
    name,
    salary: [120, 140, 130][index] ?? 70 + index * 3,
    team: ["Core", "Platform", "Data", "Web", "Mobile"][index % 5] ?? "Core",
    status: ["Active", "Planned", "Blocked", "Archived"][index % 4] ?? "Active",
    started: `2026-${String((index % 9) + 1).padStart(2, "0")}-01`,
  })
);
export const AGENT_FILTERS = [
  {
    key: "team",
    type: "multiSelect",
    label: "Team",
    options: ["Core", "Platform", "Data", "Web", "Mobile"].map((value) => ({
      value,
      label: value,
    })),
    getValue: (row: AgentPerson) => row.team,
  },
  {
    key: "status",
    type: "multiSelect",
    label: "Status",
    options: ["Active", "Planned", "Blocked", "Archived"].map((value) => ({
      value,
      label: value,
    })),
    getValue: (row: AgentPerson) => row.status,
  },
  {
    key: "started",
    type: "dateRange",
    label: "Started",
    getValue: (row: AgentPerson) => row.started,
  },
];
