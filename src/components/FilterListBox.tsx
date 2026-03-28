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
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          {/* Button */}
          <ListboxButton
            className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-all duration-200 ${
              value
                ? "bg-white border border-gray-300 text-gray-900"
                : "bg-white border border-gray-200 text-gray-400"
            } hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500`}
          >
            <span className="block truncate pr-10">{selectedLabel}</span>

            {/* Icons wrapper */}
            <span className="absolute inset-y-0 right-3 flex items-center gap-2">
              {value && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // prevent dropdown open
                    onChange("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              <ChevronDown className="h-5 w-5 text-gray-400" />
            </span>
          </ListboxButton>

          {/* Options */}
          <ListboxOptions className="absolute left-0 w-full mt-2 max-h-60 overflow-auto rounded-xl border border-gray-100 bg-white shadow-lg z-50">
            {options.length > 0 ? (
              options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  as={Fragment}
                >
                  {({ focus, selected }) => (
                    <li
                      className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all ${
                        focus ? "bg-orange-50 text-gray-900" : "text-gray-700"
                      } ${
                        selected
                          ? "bg-orange-100 font-medium text-orange-600"
                          : ""
                      }`}
                    >
                      <span className="truncate">{option.label}</span>

                      <Check
                        className={`h-4 w-4 transition-opacity ${
                          selected ? "opacity-100 text-orange-600" : "opacity-0"
                        }`}
                      />
                    </li>
                  )}
                </ListboxOption>
              ))
            ) : (
              <li className="px-4 py-3 text-center text-sm text-gray-400">
                No options available
              </li>
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
}
