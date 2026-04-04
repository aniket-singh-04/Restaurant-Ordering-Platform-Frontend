import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Check, ChevronDown, X } from "lucide-react";
import { Fragment } from "react";

interface FilterListBoxProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}
export function FilterListBox({
  options,
  value,
  onChange,
  placeholder = "Select option",
  label,
}: FilterListBoxProps) {
  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  return (
    <div className="relative">
      {label && (
        <label className="ui-field-label">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton
            className={`ui-select pr-11 text-left text-sm font-medium ${
              value ? "text-[color:var(--text-primary)]" : "text-[color:var(--text-muted)]"
            }`}
          >
            <span className="block truncate pr-10">{selectedLabel}</span>

            <span className="absolute inset-y-0 right-3 flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange("");
                  }}
                  className="rounded-full p-1 text-[color:var(--text-muted)] transition hover:bg-[color:var(--accent-soft)] hover:text-[color:var(--accent)]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <ChevronDown className="h-5 w-5 text-[color:var(--text-muted)]" />
            </span>
          </ListboxButton>

          <ListboxOptions className="absolute left-0 z-50 mt-2 max-h-60 w-full overflow-auto rounded-[1.25rem] border border-[color:var(--border-subtle)] bg-[color:var(--surface-strong)] p-1 shadow-[var(--shadow-md)]">
            {options.length > 0 ? (
              options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  as={Fragment}
                >
                  {({ focus, selected }) => (
                    <li
                      className={`flex cursor-pointer items-center justify-between rounded-[1rem] px-4 py-2.5 text-sm transition-all ${
                        focus
                          ? "bg-[color:var(--accent-soft)] text-[color:var(--text-primary)]"
                          : "text-[color:var(--text-secondary)]"
                      } ${
                        selected
                          ? "bg-[color:var(--accent-soft-strong)] font-semibold text-[color:var(--accent)]"
                          : ""
                      }`}
                    >
                      <span className="truncate">{option.label}</span>

                      <Check
                        className={`h-4 w-4 transition-opacity ${
                          selected ? "opacity-100 text-[color:var(--accent)]" : "opacity-0"
                        }`}
                      />
                    </li>
                  )}
                </ListboxOption>
              ))
            ) : (
              <li className="px-4 py-3 text-center text-sm text-[color:var(--text-muted)]">
                No options available
              </li>
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
