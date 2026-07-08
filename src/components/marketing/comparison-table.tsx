type Cell = "yes" | "no" | "partial";

const competitors = ["LifeFlow", "Notion AI", "Todoist", "Google Asst", "ChatGPT", "Motion"] as const;

const rows: Array<{ feature: string; values: [Cell, Cell, Cell, Cell, Cell, Cell] }> = [
  { feature: "Persistent memory", values: ["yes", "no", "no", "no", "partial", "no"] },
  { feature: "Proactive intelligence", values: ["yes", "no", "no", "partial", "no", "partial"] },
  { feature: "Multi-modal input", values: ["yes", "no", "no", "partial", "no", "no"] },
  { feature: "Action execution", values: ["yes", "no", "no", "partial", "no", "no"] },
  { feature: "Natural language", values: ["yes", "yes", "yes", "yes", "yes", "partial"] },
  { feature: "Cross-domain context", values: ["yes", "no", "no", "no", "no", "no"] },
  { feature: "Semantic search", values: ["yes", "no", "no", "no", "no", "no"] },
  { feature: "Image analysis", values: ["yes", "no", "no", "partial", "no", "no"] },
  { feature: "Smart reminders", values: ["yes", "no", "partial", "partial", "no", "no"] },
  { feature: "Conversation memory", values: ["yes", "no", "no", "no", "partial", "no"] },
  { feature: "Free tier", values: ["yes", "yes", "yes", "yes", "yes", "no"] },
  { feature: "Open architecture", values: ["yes", "no", "no", "no", "no", "no"] },
];

const labels: Record<Cell, string> = { yes: "Yes", partial: "Partial", no: "No" };

function Mark({ value }: { value: Cell }) {
  const glyph = value === "yes" ? "✓" : value === "partial" ? "~" : "✗";
  const color =
    value === "yes"
      ? "text-emerald-600 dark:text-emerald-400"
      : value === "partial"
        ? "text-amber-500"
        : "text-zinc-300 dark:text-zinc-700";
  return (
    <span className={color} aria-hidden="true">
      {glyph}
      <span className="sr-only">{labels[value]}</span>
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section id="compare" className="border-t border-zinc-200 px-6 py-20 dark:border-zinc-800">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-medium tracking-tight text-zinc-950 dark:text-zinc-50">
            Where LifeFlow wins
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            No current product combines persistent cross-session memory,
            proactive surfacing, and action execution in one natural-language
            interface. That&apos;s the white space LifeFlow owns.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-180 border-collapse text-sm">
            <caption className="sr-only">
              Feature comparison of LifeFlow against Notion AI, Todoist, Google Assistant, ChatGPT, and Motion
            </caption>
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <th scope="col" className="px-4 py-3 text-left font-medium text-zinc-500">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`px-4 py-3 text-center font-medium ${
                      c === "LifeFlow" ? "text-accent" : "text-zinc-500"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.feature}
                  className={i % 2 === 1 ? "bg-zinc-50/50 dark:bg-zinc-950/50" : ""}
                >
                  <th scope="row" className="px-4 py-3 text-left font-normal text-zinc-700 dark:text-zinc-300">
                    {row.feature}
                  </th>
                  {row.values.map((v, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 text-center ${j === 0 ? "bg-accent/5" : ""}`}
                    >
                      <Mark value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
