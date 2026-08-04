import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { format, subMonths } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DownloadSimple, Plus, Trash } from "@phosphor-icons/react";
import { api } from "../../convex/_generated/api";
import {
  Button,
  Field,
  Input,
  SectionTitle,
  Select,
  SkeletonRows,
} from "../components/ui";
import { downloadCsv, eur, isoToday, SOURCE_LABELS } from "../lib/format";

const PALETTE = ["#0f5c63", "#2b8188", "#4a9fa4", "#7dc0c2", "#e8b04b", "#c05b4d", "#a3906f", "#57503f"];

export default function AnalyticsPage() {
  const [start, setStart] = useState(format(subMonths(new Date(), 5), "yyyy-MM-01"));
  const [end, setEnd] = useState(isoToday());
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const report = useQuery(api.analytics.report, { start, end });
  const exportData = useQuery(api.analytics.exportData, { start, end });
  const expenses = useQuery(api.payments.expensesInRange, { start, end });
  const recordExpense = useMutation(api.payments.recordExpense);
  const removeExpense = useMutation(api.payments.removeExpense);

  return (
    <div>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Analytics & accounting</h1>
          <p className="mt-1 text-sm text-ink-faint">
            How the season is really going — and the numbers for the books.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="From">
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
      </header>

      {/* KPI strip — no boxes, just dividers */}
      <div className="grid grid-cols-2 gap-y-5 rounded-xl2 border border-sand-200 bg-white py-5 md:grid-cols-5 md:divide-x md:divide-sand-200" style={{ boxShadow: "var(--shadow-diffuse)" }}>
        {[
          { label: "Bookings", value: report ? String(report.totalBookings) : "…" },
          { label: "Nights sold", value: report ? String(report.totalNights) : "…" },
          { label: "ADR", value: report ? eur(report.adr) : "…" },
          { label: "Revenue", value: report ? eur(report.totalRevenue) : "…" },
          { label: "Expenses", value: report ? eur(report.totalExpenses) : "…" },
        ].map((kpi) => (
          <div key={kpi.label} className="px-6">
            <p className="text-xs font-medium text-ink-faint">{kpi.label}</p>
            <p className="num mt-1 text-2xl font-bold tracking-tight">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts — asymmetric 2fr/1fr */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle>Revenue vs expenses</SectionTitle>
          <div className="rounded-xl2 border border-sand-200 bg-white p-5" style={{ boxShadow: "var(--shadow-diffuse)" }}>
            {report === undefined ? (
              <SkeletonRows count={4} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={report.monthly} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eae2d4" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8b8270" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8b8270" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => eur(Number(value))}
                    contentStyle={{ borderRadius: 12, border: "1px solid #eae2d4", fontSize: 13 }}
                  />
                  <Bar dataKey="revenue" name="Revenue" fill="#0f5c63" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#d9ccb6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-8">
            <SectionTitle>Occupancy</SectionTitle>
            <div className="rounded-xl2 border border-sand-200 bg-white p-5" style={{ boxShadow: "var(--shadow-diffuse)" }}>
              {report === undefined ? (
                <SkeletonRows count={3} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={report.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eae2d4" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#8b8270" }} axisLine={false} tickLine={false} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11, fill: "#8b8270" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(value) => `${value}%`}
                      contentStyle={{ borderRadius: 12, border: "1px solid #eae2d4", fontSize: 13 }}
                    />
                    <Line type="monotone" dataKey="occupancy" stroke="#2b8188" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div>
            <SectionTitle>Booking sources</SectionTitle>
            <div className="rounded-xl2 border border-sand-200 bg-white p-5" style={{ boxShadow: "var(--shadow-diffuse)" }}>
              {report === undefined ? (
                <SkeletonRows count={3} />
              ) : report.bySource.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-faint">No bookings in range.</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie
                        data={report.bySource}
                        dataKey="count"
                        nameKey="source"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {report.bySource.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} bookings`, SOURCE_LABELS[String(name)] ?? name]}
                        contentStyle={{ borderRadius: 12, border: "1px solid #eae2d4", fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {report.bySource.map((row, i) => (
                      <li key={row.source} className="flex items-center justify-between text-[13px]">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                          {SOURCE_LABELS[row.source] ?? row.source}
                        </span>
                        <span className="num text-ink-faint">
                          {row.count} · {eur(row.revenue)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div>
            <SectionTitle>Activity popularity</SectionTitle>
            <div className="rounded-xl2 border border-sand-200 bg-white p-5" style={{ boxShadow: "var(--shadow-diffuse)" }}>
              {report === undefined ? (
                <SkeletonRows count={3} />
              ) : report.activityPopularity.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink-faint">No sessions in range.</p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {report.activityPopularity.map((activity) => {
                    const max = report.activityPopularity[0].participants;
                    return (
                      <li key={activity.name}>
                        <div className="mb-1 flex justify-between text-[13px]">
                          <span className="font-medium">{activity.name}</span>
                          <span className="num text-ink-faint">{activity.participants}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-sand-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(activity.participants / max) * 100}%`,
                              background: activity.color,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div>
            <SectionTitle>Guest nationalities</SectionTitle>
            <div className="rounded-xl2 border border-sand-200 bg-white p-5" style={{ boxShadow: "var(--shadow-diffuse)" }}>
              {report === undefined ? (
                <SkeletonRows count={2} />
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {report.byCountry.map((row) => (
                    <li key={row.country} className="rounded-full border border-sand-200 px-3 py-1 text-[13px]">
                      {row.country} <span className="num font-bold">{row.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Exports */}
      <div className="mt-12">
        <SectionTitle>Export for the books</SectionTitle>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            disabled={!exportData}
            onClick={() => exportData && downloadCsv(`bookings_${start}_${end}.csv`, exportData.bookings)}
          >
            <DownloadSimple size={16} weight="bold" /> Bookings CSV
          </Button>
          <Button
            variant="secondary"
            disabled={!exportData}
            onClick={() => exportData && downloadCsv(`payments_${start}_${end}.csv`, exportData.payments)}
          >
            <DownloadSimple size={16} weight="bold" /> Payments CSV
          </Button>
          <Button
            variant="secondary"
            disabled={!exportData}
            onClick={() => exportData && downloadCsv(`expenses_${start}_${end}.csv`, exportData.expenses)}
          >
            <DownloadSimple size={16} weight="bold" /> Expenses CSV
          </Button>
        </div>
      </div>

      {/* Expenses ledger */}
      <div className="mt-12">
        <SectionTitle
          right={
            <Button size="sm" variant="secondary" onClick={() => setShowExpenseForm((s) => !s)}>
              <Plus size={14} weight="bold" /> Add expense
            </Button>
          }
        >
          Expense ledger
        </SectionTitle>

        {showExpenseForm && (
          <form
            className="mb-4 grid grid-cols-1 items-end gap-3 rounded-xl2 border border-sand-200 bg-white p-4 md:grid-cols-[1fr_1fr_2fr_1fr_auto]"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              await recordExpense({
                category: form.get("category") as "food" | "staff" | "equipment" | "maintenance" | "transport" | "utilities" | "other",
                amount: Number(form.get("amount")),
                date: String(form.get("date")),
                description: String(form.get("description")),
              });
              setShowExpenseForm(false);
            }}
          >
            <Field label="Category">
              <Select name="category" defaultValue="food">
                {["food", "staff", "equipment", "maintenance", "transport", "utilities", "other"].map((c) => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Amount (EUR)">
              <Input name="amount" type="number" step="0.01" min="0.01" required />
            </Field>
            <Field label="Description">
              <Input name="description" required placeholder="What was it for?" />
            </Field>
            <Field label="Date">
              <Input name="date" type="date" defaultValue={isoToday()} required />
            </Field>
            <Button type="submit">Save</Button>
          </form>
        )}

        <div className="overflow-x-auto rounded-xl2 border border-sand-200 bg-white" style={{ boxShadow: "var(--shadow-diffuse)" }}>
          {expenses === undefined ? (
            <div className="p-4"><SkeletonRows count={3} /></div>
          ) : expenses.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-faint">No expenses in this range.</p>
          ) : (
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-faint">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="num px-5 py-3">{expense.date}</td>
                    <td className="px-5 py-3 capitalize">{expense.category}</td>
                    <td className="px-5 py-3 text-ink-soft">{expense.description}</td>
                    <td className="num px-5 py-3 text-right font-semibold">{eur(expense.amount)}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => void removeExpense({ expenseId: expense._id })}
                        className="text-ink-faint transition-colors hover:text-coral cursor-pointer"
                        title="Delete"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
