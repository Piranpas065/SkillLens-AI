import * as React from "react";

export function SimpleAccordion({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border rounded-lg mb-2 bg-gray-50 dark:bg-gray-800">
      <button
        className="w-full flex justify-between items-center px-4 py-2 text-left font-medium text-gray-900 dark:text-gray-100 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="ml-2">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 pb-3 text-gray-700 dark:text-gray-200 text-sm">{children}</div>}
    </div>
  );
}
