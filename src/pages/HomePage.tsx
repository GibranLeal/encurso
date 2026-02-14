export function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-neutral-500">Dashboard</div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Home</h1>
      </div>

      {/* cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Today’s Money" value="$53k" delta="+55% than last week" />
        <Card title="Today’s Users" value="2,300" delta="+3% than last month" />
        <Card title="New Clients" value="3,462" delta="-2% than yesterday" />
        <Card title="Sales" value="$103,430" delta="+5% than yesterday" />
      </div>

      {/* panels */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Website View" subtitle="Last Campaign Performance" />
        <Panel title="Daily Sales" subtitle="15% increase in today sales" />
        <Panel title="Completed Tasks" subtitle="Last Campaign Performance" />
      </div>
    </div>
  );
}

function Card({ title, value, delta }: { title: string; value: string; delta: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-medium text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-neutral-900">{value}</div>
      <div className="mt-2 text-xs text-neutral-500">{delta}</div>
    </div>
  );
}

function Panel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      <div className="text-xs text-neutral-500">{subtitle}</div>
      <div className="mt-4 h-44 rounded-xl bg-neutral-50" />
      <div className="mt-3 text-[11px] text-neutral-400">updated just now</div>
    </div>
  );
}
