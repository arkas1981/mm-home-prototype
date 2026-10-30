import type {
  CSSProperties,
} from "react";

import {
  toISO,
} from "@/lib/booking";

export interface DayInfo {
  disabled?: boolean;
  className?: string;
  title?: string;
  mark?: string;

  /*
   * Allows the admin calendar
   * to use a different colour
   * for each booking and a
   * split colour on turnover days.
   */
  style?: CSSProperties;

  markClassName?: string;
}

export function MonthCalendar({
  year,
  month,
  locale,
  info,
  onPick,
}: {
  year: number;
  month: number;
  locale: string;

  info: (
    iso: string
  ) => DayInfo;

  onPick?: (
    iso: string
  ) => void;
}) {
  const first =
    new Date(
      year,
      month,
      1
    );

  const offset =
    (
      first.getDay() +
      6
    ) %
    7;

  const days =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  const wd =
    Array.from(
      {
        length: 7,
      },

      (
        _,
        i
      ) =>
        new Date(
          2024,
          0,
          1 + i
        ).toLocaleDateString(
          locale,
          {
            weekday:
              "narrow",
          }
        )
    );

  return (
    <div className="w-full">
      <p className="font-serif text-2xl mb-4 capitalize">
        {first.toLocaleDateString(
          locale,
          {
            month:
              "long",

            year:
              "numeric",
          }
        )}
      </p>

      <div className="grid grid-cols-7 gap-2 text-center text-sm text-muted-foreground mb-2">
        {wd.map(
          (
            d,
            i
          ) => (
            <span
              key={
                i
              }
            >
              {d}
            </span>
          )
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from(
          {
            length:
              offset,
          }
        ).map(
          (
            _,
            i
          ) => (
            <span
              key={
                "e" +
                i
              }
            />
          )
        )}

        {Array.from(
          {
            length:
              days,
          },

          (
            _,
            i
          ) => {
            const iso =
              toISO(
                new Date(
                  year,
                  month,
                  i +
                    1
                )
              );

            const d =
              info(
                iso
              );

            return (
              <button
                key={
                  iso
                }
                type="button"
                disabled={
                  d.disabled
                }
                title={
                  d.title
                }
                onClick={() =>
                  onPick?.(
                    iso
                  )
                }
                style={
                  d.style
                }
                className={`relative aspect-square rounded-lg text-base font-medium transition-all border border-border/60 ${
                  d.className ??
                  "hover:bg-accent"
                } ${
                  d.disabled
                    ? "cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <span className="relative z-10">
                  {i +
                    1}
                </span>

                {d.mark && (
                  <span
                    className={`absolute z-10 bottom-1 left-1/2 -translate-x-1/2 text-[10px] leading-none whitespace-nowrap ${
                      d.markClassName ??
                      ""
                    }`}
                  >
                    {
                      d.mark
                    }
                  </span>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
}
