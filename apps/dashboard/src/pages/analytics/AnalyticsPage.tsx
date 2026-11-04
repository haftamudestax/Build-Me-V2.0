import { useCallback, useEffect, useState } from "react";
import { protectedApiGet } from "../../lib/protectedApi";
type QueryValue = string | number | boolean | null | undefined;
type DataRecord = Record<string, unknown>;

interface AnalyticsPageProps {
  title: string;
  description: string;
  summaryPath: string;
  eventsPath: string;
  supportsDays?: boolean;
  supportsEventFilter?: boolean;
}

const EVENT_COLUMNS = [
  "timestamp",
  "event_name",
  "event_type",
  "feature",
  "visitor_id",
  "session_id",
  "source_route",
  "destination_route",
  "journey",
] as const;

const PROJECT_COLUMNS = [
  "project_title",
  "title",
  "project_name",
  "description",
  "requester_name",
  "name",
  "requester_email",
  "email",
  "status",
  "created_at",
  "submitted_at",
] as const;

function isRecord(value: unknown): value is DataRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeEventName(value: string): string {
  return value
    .replace(/\./g, " › ")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function isDateField(key: string): boolean {
  return /(^|_)(timestamp|created_at|updated_at|submitted_at|occurred_at|generated_at|start|end|date)$/i.test(
    key,
  );
}

function formatValue(value: unknown, key = ""): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat().format(value);
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (typeof value === "string") {
    if (isDateField(key) && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return formatDate(value);
    }

    if (
      key === "event_name" ||
      key === "eventName" ||
      key === "event_type" ||
      key === "eventType"
    ) {
      return humanizeEventName(value);
    }

    return value;
  }

  if (Array.isArray(value)) {
    return value.length
      ? value.map((item) => formatValue(item)).join(", ")
      : "—";
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([childKey, childValue]) => {
        if (isRecord(childValue) || Array.isArray(childValue)) {
          return `${formatLabel(childKey)}: ${formatValue(childValue, childKey)}`;
        }

        return `${formatLabel(childKey)}: ${formatValue(childValue, childKey)}`;
      })
      .join(" · ");
  }

  return String(value);
}

function normalizeKey(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
}

function findValue(record: DataRecord, candidates: readonly string[]): unknown {
  const entries = Object.entries(record);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeKey(candidate);

    const match = entries.find(
      ([key, value]) =>
        normalizeKey(key) === normalizedCandidate &&
        value !== null &&
        value !== undefined &&
        value !== "",
    );

    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function getRecordValue(record: DataRecord, key: string): unknown {
  const direct = findValue(record, [key]);

  if (direct !== undefined) {
    return direct;
  }

  const nestedContainers = [
    "metadata",
    "details",
    "project",
    "booking",
    "request",
    "requester",
    "user",
  ];

  for (const containerName of nestedContainers) {
    const nested = findValue(record, [containerName]);

    if (isRecord(nested)) {
      const nestedValue = findValue(nested, [key]);

      if (nestedValue !== undefined) {
        return nestedValue;
      }
    }
  }

  return undefined;
}

function extractRecords(data: unknown): DataRecord[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

  if (!isRecord(data)) {
    return [];
  }

  const collectionKeys = ["items", "events", "records", "results", "data"];

  for (const key of collectionKeys) {
    const value = findValue(data, [key]);

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }

    if (isRecord(value)) {
      const nested = extractRecords(value);

      if (nested.length) {
        return nested;
      }
    }
  }

  return [];
}

function hasProjectDetails(records: DataRecord[]): boolean {
  return records.some((record) =>
    [
      "project_title",
      "projectTitle",
      "project_name",
      "projectName",
      "requester_name",
      "requesterName",
      "requester_email",
      "requesterEmail",
    ].some((key) => getRecordValue(record, key) !== undefined),
  );
}

function getEventColumns(records: DataRecord[]): string[] {
  const keys = new Set<string>();

  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (
        [
          "metadata",
          "details",
          "project",
          "booking",
          "requester",
          "user",
        ].includes(normalizeKey(key))
      ) {
        const nested = record[key];

        if (isRecord(nested)) {
          for (const nestedKey of Object.keys(nested)) {
            keys.add(nestedKey);
          }
        }

        continue;
      }

      keys.add(key);
    }
  }

  const preferred = EVENT_COLUMNS.filter((column) =>
    Array.from(keys).some((key) => normalizeKey(key) === normalizeKey(column)),
  );

  const remaining = Array.from(keys).filter(
    (key) =>
      !preferred.some((column) => normalizeKey(column) === normalizeKey(key)),
  );

  return [...preferred, ...remaining];
}

function DataTable({
  records,
  columns,
}: {
  records: DataRecord[];
  columns: string[];
}) {
  if (records.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
        No records found for the selected filters.
      </p>
    );
  }

  if (columns.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Records were returned, but no displayable fields were found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                scope="col"
                className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700"
              >
                {formatLabel(column)}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {records.map((record, index) => {
            const id =
              findValue(record, ["id", "event_id", "booking_id"]) ?? index;

            return (
              <tr key={String(id)} className="align-top hover:bg-slate-50">
                {columns.map((column) => {
                  const value = getRecordValue(record, column);
                  const normalized = normalizeKey(column);
                  const isLongText =
                    /description|metadata|message|details|route/.test(
                      normalized,
                    );

                  return (
                    <td
                      key={column}
                      className={`px-4 py-3 text-slate-700 ${
                        isLongText
                          ? "min-w-64 max-w-md whitespace-normal break-words"
                          : "max-w-xs whitespace-normal break-words"
                      }`}
                    >
                      {formatValue(value, column)}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryView({ data }: { data: unknown }) {
  if (data === null || data === undefined) {
    return <p className="text-sm text-slate-500">No summary data returned.</p>;
  }

  if (!isRecord(data)) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-slate-700">
        {formatValue(data)}
      </p>
    );
  }

  const metrics: Array<{ key: string; label: string; value: unknown }> = [];

  function collectMetrics(record: DataRecord, prefix = "") {
    for (const [key, value] of Object.entries(record)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (isRecord(value)) {
        collectMetrics(value, fullKey);
      } else if (Array.isArray(value)) {
        metrics.push({
          key: fullKey,
          label: fullKey.split(".").map(formatLabel).join(" · "),
          value: value.length ? value.join(", ") : "—",
        });
      } else {
        metrics.push({
          key: fullKey,
          label: fullKey.split(".").map(formatLabel).join(" · "),
          value,
        });
      }
    }
  }

  collectMetrics(data);

  if (metrics.length === 0) {
    return (
      <p className="text-sm text-slate-500">No summary metrics returned.</p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <article
          key={metric.key}
          className="min-w-0 rounded-lg border border-slate-200 bg-white p-5"
        >
          <p className="text-sm font-medium text-slate-500">{metric.label}</p>
          <p className="mt-2 break-words text-xl font-semibold text-slate-900">
            {formatValue(metric.value, metric.key.split(".").at(-1) ?? "")}
          </p>
        </article>
      ))}
    </div>
  );
}

export function AnalyticsPage({
  title,
  description,
  summaryPath,
  eventsPath,
  supportsDays = false,
  supportsEventFilter = false,
}: AnalyticsPageProps) {
  const [days, setDays] = useState(30);
  const [eventName, setEventName] = useState("");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [summary, setSummary] = useState<unknown>(null);
  const [events, setEvents] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(
    async (signal: AbortSignal) => {
      const summaryQuery: Record<string, QueryValue> = {};
      const eventsQuery: Record<string, QueryValue> = { limit, offset };

      if (supportsDays) {
        summaryQuery.days = days;
      }

      if (supportsEventFilter && eventName.trim()) {
        eventsQuery.event_name = eventName.trim();
      }

      setError(null);

      try {
        const [summaryResult, eventsResult] = await Promise.all([
          protectedApiGet<unknown>(summaryPath, {
            query: summaryQuery,
            signal,
          }),
          protectedApiGet<unknown>(eventsPath, {
            query: eventsQuery,
            signal,
          }),
        ]);

        if (signal.aborted) {
          return;
        }

        setSummary(summaryResult);
        setEvents(eventsResult);
      } catch (caught: unknown) {
        if (signal.aborted) {
          return;
        }

        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load analytics.",
        );
      } finally {
        if (!signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      days,
      eventName,
      eventsPath,
      limit,
      offset,
      summaryPath,
      supportsDays,
      supportsEventFilter,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadAnalytics(controller.signal);
      }
    });

    return () => controller.abort();
  }, [loadAnalytics]);

  const refresh = () => {
    setRefreshing(true);

    const controller = new AbortController();
    void loadAnalytics(controller.signal);
  };

  const previousPage = () => {
    setOffset((current) => Math.max(0, current - limit));
  };

  const nextPage = () => {
    setOffset((current) => current + limit);
  };

  const eventRecords = extractRecords(events);
  const projectPage = title.toLowerCase().includes("delivery project");
  const projectRecords = projectPage && hasProjectDetails(eventRecords);

  const projectColumns = PROJECT_COLUMNS.filter((column) =>
    eventRecords.some((record) => getRecordValue(record, column) !== undefined),
  );

  const eventColumns = getEventColumns(eventRecords);

  const displayColumns = projectRecords ? projectColumns : eventColumns;

  const hasNextPage =
    eventRecords.length === limit ||
    (isRecord(events) &&
      Object.values(events).some(
        (value) => typeof value === "number" && value > offset + limit,
      ));

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={loading || refreshing}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <section
        aria-label="Analytics filters"
        className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4"
      >
        {supportsDays && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Reporting period
            <select
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setOffset(0);
              }}
              className="rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </label>
        )}

        {supportsEventFilter && (
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Event name
            <input
              value={eventName}
              onChange={(event) => {
                setEventName(event.target.value);
                setOffset(0);
              }}
              placeholder="e.g. delivery_project.booking_submitted"
              className="min-w-64 rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        )}

        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Records per page
          <select
            value={limit}
            onChange={(event) => {
              setLimit(Number(event.target.value));
              setOffset(0);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </label>
      </section>

      {error && (
        <section
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <p className="font-semibold">Unable to load analytics</p>
          <p className="mt-1">{error}</p>
          {error.toLowerCase().includes("sign in") && (
            <p className="mt-2">Return to the login page and sign in again.</p>
          )}
        </section>
      )}

      {loading ? (
        <p role="status" className="text-sm text-slate-500">
          Loading analytics…
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
            <SummaryView data={summary} />
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {projectPage ? "Project Requests & Events" : "Events"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {projectRecords
                    ? "Project details are shown when they are included in the API response."
                    : "Event records returned by the analytics service."}
                </p>
              </div>

              <p className="text-sm text-slate-500">
                Showing records {eventRecords.length ? offset + 1 : 0}–
                {offset + eventRecords.length}
              </p>
            </div>

            {projectPage && !projectRecords && eventRecords.length > 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                These records contain analytics events, not project request
                details. The project title, description, and requester contact
                information must be supplied by the bookings/project API or
                included in the event metadata.
              </p>
            )}

            <DataTable records={eventRecords} columns={displayColumns} />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={previousPage}
                disabled={offset === 0}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-slate-500">
                Page {Math.floor(offset / limit) + 1}
              </span>

              <button
                type="button"
                onClick={nextPage}
                disabled={!hasNextPage}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
