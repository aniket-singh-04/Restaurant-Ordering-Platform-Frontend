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
              value ? "text-(--text-primary)" : "text-(--text-muted)"
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
                  className="rounded-full p-1 text-(--text-muted) transition hover:bg-(--accent-soft) hover:text-(--accent)"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <ChevronDown className="h-5 w-5 text-(--text-muted)" />
            </span>
          </ListboxButton>

          <ListboxOptions className="absolute left-0 z-500 mt-2 max-h-60 w-full overflow-auto scrollbar-thin rounded-[1.25rem] border border-(--border-subtle) bg-(--surface-strong) p-1 shadow-(--shadow-md)">
            {options.length > 0 ? (
              options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  as={Fragment}
                >
                  {({ focus, selected }) => (
                    <li
                      className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-2.5 text-sm transition-all ${
                        focus
                          ? "bg-(--accent-soft) text-(--text-primary)"
                          : "text-(--text-secondary)"
                      } ${
                        selected
                          ? "bg-(--accent-soft-strong) font-semibold text-(--accent)"
                          : ""
                      }`}
                    >
                      <span className="truncate">{option.label}</span>

                      <Check
                        className={`h-4 w-4 transition-opacity ${
                          selected ? "opacity-100 text-(--accent)" : "opacity-0"
                        }`}
                      />
                    </li>
                  )}
                </ListboxOption>
              ))
            ) : (
              <li className="px-4 py-3 text-center text-sm text-(--text-muted)">
                No options available
              </li>
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
