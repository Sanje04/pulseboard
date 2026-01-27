// OPTION 1: Native Select with Better Styling
// Simple, accessible, works everywhere
export function SeveritySelectNative() {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Severity <span className="text-red-500">*</span>
      </label>
      <select
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={newIncident.severity}
        onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
      >
        <option value="SEV1" className="bg-background text-foreground">SEV1 - Critical</option>
        <option value="SEV2" className="bg-background text-foreground">SEV2 - High</option>
        <option value="SEV3" className="bg-background text-foreground">SEV3 - Medium</option>
        <option value="SEV4" className="bg-background text-foreground">SEV4 - Low</option>
      </select>
    </div>
  );
}


// OPTION 2: Radio Button Cards
// Best for visual clarity and touch-friendly
export function SeverityRadioCards() {
  const severityOptions = [
    { value: "SEV1", label: "SEV1", desc: "Critical", color: "border-red-500 hover:bg-red-50 dark:hover:bg-red-950" },
    { value: "SEV2", label: "SEV2", desc: "High", color: "border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950" },
    { value: "SEV3", label: "SEV3", desc: "Medium", color: "border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950" },
    { value: "SEV4", label: "SEV4", desc: "Low", color: "border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Severity <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-2">
        {severityOptions.map((opt) => (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-lg border-2 p-3 transition ${
              newIncident.severity === opt.value
                ? `${opt.color} border-opacity-100 bg-opacity-10`
                : "border-border hover:border-muted-foreground"
            }`}
          >
            <input
              type="radio"
              name="severity"
              value={opt.value}
              checked={newIncident.severity === opt.value}
              onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
              className="sr-only"
            />
            <div className="font-medium text-sm">{opt.label}</div>
            <div className="text-xs text-muted-foreground">{opt.desc}</div>
          </label>
        ))}
      </div>
    </div>
  );
}


// OPTION 3: Button Group (Horizontal)
// Clean, modern, takes less vertical space
export function SeverityButtonGroup() {
  const severityOptions = [
    { value: "SEV1", label: "SEV1", emoji: "🔴" },
    { value: "SEV2", label: "SEV2", emoji: "🟠" },
    { value: "SEV3", label: "SEV3", emoji: "🟡" },
    { value: "SEV4", label: "SEV4", emoji: "🔵" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Severity <span className="text-red-500">*</span>
      </label>
      <div className="flex gap-2">
        {severityOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setNewIncident({ ...newIncident, severity: opt.value as IncidentSeverity })}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
              newIncident.severity === opt.value
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <span className="mr-1">{opt.emoji}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// OPTION 4: Segmented Control (iOS-style)
// Very modern, compact
export function SeveritySegmentedControl() {
  const severityOptions = [
    { value: "SEV1", label: "1" },
    { value: "SEV2", label: "2" },
    { value: "SEV3", label: "3" },
    { value: "SEV4", label: "4" },
  ];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Severity <span className="text-red-500">*</span>
      </label>
      <div className="inline-flex rounded-lg border border-border p-1 gap-1 bg-muted/30">
        {severityOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setNewIncident({ ...newIncident, severity: opt.value as IncidentSeverity })}
            className={`px-4 py-1.5 text-sm rounded-md transition ${
              newIncident.severity === opt.value
                ? "bg-background shadow-sm font-medium"
                : "hover:bg-muted/50"
            }`}
          >
            SEV{opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}


// OPTION 5: Dropdown Badges with Colors
// Visual severity indicators
export function SeverityBadgeSelect() {
  const severityOptions = [
    { value: "SEV1", label: "SEV1 - Critical", color: "bg-red-500" },
    { value: "SEV2", label: "SEV2 - High", color: "bg-orange-500" },
    { value: "SEV3", label: "SEV3 - Medium", color: "bg-yellow-500" },
    { value: "SEV4", label: "SEV4 - Low", color: "bg-blue-500" },
  ];

  const currentSeverity = severityOptions.find(s => s.value === newIncident.severity);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        Severity <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={newIncident.severity}
          onChange={(e) => setNewIncident({ ...newIncident, severity: e.target.value as IncidentSeverity })}
        >
          <option value="SEV1">SEV1 - Critical</option>
          <option value="SEV2">SEV2 - High</option>
          <option value="SEV3">SEV3 - Medium</option>
          <option value="SEV4">SEV4 - Low</option>
        </select>
        <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${currentSeverity?.color}`} />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
