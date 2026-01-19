import { useRef, useState } from "react";
import { restaurants } from "./constants";
import { useClickOutside } from "./useClickOutside";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

export default function RestaurantSelector({
  onApply,
}: {
  onApply: (restaurant: string, table: number) => void;
}) {
  const [restaurant, setRestaurant] = useState<string | null>(null);
  const [table, setTable] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, () => setOpen(false));

  const selectedRestaurant = restaurants.find((r) => r.name === restaurant);

  function apply() {
    if (!restaurant || !table) return;
    onApply(restaurant, table);
    setOpen(false);
  }

 return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-2 text-xs text-white rounded-2xl cursor-pointer
        bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938]
        hover:opacity-90"
      >
        {restaurant ?? "Restaurant"}
      </button>

      {open && (
        <div
          className="absolute w-56 p-4 text-left bg-white rounded-lg shadow-lg
          ring-1 ring-[#f99e1f]/30 z-50"
        >
          {/* Restaurant */}
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Restaurant
          </label>

          <Listbox
            value={restaurant}
            onChange={(value) => {
              setRestaurant(value);
              setTable(null);
            }}
          >
            <div className="relative mb-4">
              <ListboxButton
                className="cursor-pointer w-full rounded-md border
                border-[#f99e1f]/40 bg-white px-3 py-2 text-sm
                flex justify-between items-center
                hover:border-[#f97415]
                focus:outline-none focus:ring-1 focus:ring-[#f97415]"
              >
                <span>{restaurant || "Select Restaurant"}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </ListboxButton>

              <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                {restaurants.map((r) => (
                  <ListboxOption
                    key={r.id}
                    value={r.name}
                    className={({ focus }) =>
                      `cursor-pointer px-3 py-2 text-sm
                      ${
                        focus
                          ? "bg-[#f99e1f]/15 text-[#f97415]"
                          : "text-gray-900"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <div className="flex justify-between items-center">
                        <span>{r.name}</span>
                        {selected && (
                          <CheckIcon className="h-4 w-4 text-[#f97415]" />
                        )}
                      </div>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>

          {/* Table */}
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Table
          </label>

          <Listbox value={table} onChange={setTable} disabled={!restaurant}>
            <div className="relative mb-6">
              <ListboxButton
                className={`w-full rounded-md border px-3 py-2 text-sm
                flex justify-between items-center
                ${
                  restaurant
                    ? "bg-white border-[#f99e1f]/40 hover:border-[#f97415]"
                    : "bg-[#fac938]/10 cursor-not-allowed text-gray-400"
                }`}
              >
                <span>{table ? `Table ${table}` : "Select Table"}</span>
                <ChevronDownIcon className="h-4 w-4 text-gray-500" />
              </ListboxButton>

              {restaurant && (
                <ListboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg">
                  {Array.from(
                    { length: selectedRestaurant?.tableCount ?? 0 },
                    (_, i) => i + 1
                  ).map((num) => (
                    <ListboxOption
                      key={num}
                      value={num}
                      className={({ focus }) =>
                        `cursor-pointer px-3 py-2 text-sm
                        ${
                          focus
                            ? "bg-[#f99e1f]/15 text-[#f97415]"
                            : "text-gray-900"
                        }`
                      }
                    >
                      {({ selected }) => (
                        <div className="flex justify-between items-center">
                          <span>Table {num}</span>
                          {selected && (
                            <CheckIcon className="h-4 w-4 text-[#f97415]" />
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              )}
            </div>
          </Listbox>

          {/* Actions */}
          <div className="flex flex-row gap-3 justify-between">
            <button
              onClick={apply}
              disabled={!table}
              className="cursor-pointer w-full sm:w-auto text-white
              bg-linear-to-br from-[#f97415] via-[#f99e1f] to-[#fac938]
              hover:opacity-90 disabled:bg-[#fac938]/40
              disabled:cursor-not-allowed
              px-2 rounded-md text-sm font-medium transition"
            >
              Go to Menu
            </button>

            <button
              onClick={() => setOpen(false)}
              className="cursor-pointer sm:w-auto
              bg-[#f99e1f]/10 hover:bg-[#f99e1f]/20
              text-[#f97415] px-4 py-2 rounded-md
              text-sm font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );

}
