import { createFileRoute, Link } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  LogOut,
} from "lucide-react";

import {
  adminLogin,
  adminLogout,
  adminSession,
} from "@/lib/admin-auth.functions";

import {
  adminAddBlockD1 as adminAddBlock,
  adminAddOverrideD1 as adminAddOverride,
  adminDataD1 as adminData,
  adminRemoveBlockD1 as adminRemoveBlock,
  adminRemoveOverrideD1 as adminRemoveOverride,
  adminSetBookingStatusD1 as adminSetBookingStatus,
} from "@/lib/d1-admin.functions";

import {
  toBlock,
  toBooking,
  toOverride,
  type BookingRow,
} from "@/lib/cloud-data";

import type {
  Block,
  Override,
} from "@/lib/booking";

import {
  addDays,
  diffDays,
  flexRateFor,
  minNightsFor,
  nightTaken,
  nonRefOf,
  toISO,
  type Booking,
} from "@/lib/booking";

import {
  todayISO,
  update,
  useStore,
} from "@/lib/store";

import { MonthCalendar } from "@/components/MonthCalendar";
import { AdminReviews } from "@/components/AdminReviews";
import { AdminManualBooking } from "@/components/AdminManualBooking";
import { Logo } from "@/components/site";
import { SLOGAN } from "@/lib/i18n";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/admin")({
  head: () => ({
    ...meta(
      "Διαχείριση — MM Home",
      "Πίνακας διαχείρισης MM Home."
    ),
    meta: [
      ...meta(
        "Διαχείριση — MM Home",
        "Πίνακας διαχείρισης MM Home."
      ).meta,
      {
        name: "robots",
        content: "noindex",
      },
    ],
  }),
  component: Admin,
});

const TABS = [
  "dashboard",
  "calendar",
  "bookings",
  "pricing",
  "blocks",
  "reviews",
  "notifications",
  "emails",
] as const;

type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Πίνακας ελέγχου",
  calendar: "Ημερολόγιο",
  bookings: "Κρατήσεις",
  pricing: "Τιμές",
  blocks: "Μπλοκαρισμένες ημερομηνίες",
  reviews: "Αξιολογήσεις",
  notifications: "Ειδοποιήσεις",
  emails: "Email",
};

const eur = (n: number) =>
  `€${n.toLocaleString("el-GR")}`;

const fd = (iso: string) =>
  new Date(
    iso + "T12:00:00"
  ).toLocaleDateString("el-GR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const feeOf = (
  gross: number,
  count: number
) =>
  Math.round(
    gross * 0.015 +
      count * 0.25
  );

type AdminState = {
  bookings: Booking[];
  blocks: Block[];
  overrides: Override[];
  reload: () => Promise<void>;
};

const AdminCtx =
  createContext<AdminState>({
    bookings: [],
    blocks: [],
    overrides: [],
    reload: async () => {},
  });

const useAdmin = () =>
  useContext(AdminCtx);

function Admin() {
  const [authed, setAuthed] =
    useState<boolean | null>(null);

  const [tab, setTab] =
    useState<Tab>("dashboard");

  const [detail, setDetail] =
    useState<string | null>(null);

  const fetchData =
    useServerFn(adminData);

  const sessionFn =
    useServerFn(adminSession);

  const logoutFn =
    useServerFn(adminLogout);

  const [data, setData] =
    useState<
      Omit<AdminState, "reload">
    >({
      bookings: [],
      blocks: [],
      overrides: [],
    });

  const reload =
    useCallback(async () => {
      const d =
        await fetchData();

      setData({
        bookings: (
          d.bookings as BookingRow[]
        )
          .filter(
            (b) =>
              b.status !== "pending"
          )
          .map(toBooking),

        blocks:
          d.blocks.map(toBlock),

        overrides:
          d.overrides.map(
            toOverride
          ),
      });
    }, [fetchData]);

  const check =
    useCallback(async () => {
      try {
        const session =
          await sessionFn();

        if (
          !session.authenticated
        ) {
          setAuthed(false);
          return;
        }

        setAuthed(true);
        await reload();
      } catch {
        setAuthed(false);
      }
    }, [reload, sessionFn]);

  useEffect(() => {
    check();
  }, [check]);

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Φόρτωση…
      </div>
    );
  }

  if (!authed) {
    return (
      <AdminLogin
        onIn={check}
      />
    );
  }

  return (
    <AdminCtx.Provider
      value={{
        ...data,
        reload,
      }}
    >
      <div className="min-h-screen bg-muted/40">
        <header className="sticky top-0 z-30 bg-background border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={32} />

              <span className="font-serif text-xl">
                MM Home Admin
              </span>

              <span className="text-[10px] uppercase tracking-widest border rounded-full px-2 py-0.5 text-primary border-primary">
                D1
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Link
                to="/"
                className="text-muted-foreground hidden sm:inline"
              >
                Προβολή site
              </Link>

              <button
                onClick={async () => {
                  await logoutFn();
                  setAuthed(false);
                }}
                aria-label="Αποσύνδεση"
                title="Αποσύνδεση"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <nav className="mx-auto max-w-6xl px-4 flex gap-1 overflow-x-auto pb-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setDetail(null);
                }}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  tab === t
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6">
          {detail ? (
            <BookingDetail
              id={detail}
              onBack={() =>
                setDetail(null)
              }
            />
          ) : (
            <>
              {tab ===
                "dashboard" && (
                <Dashboard />
              )}

              {tab ===
                "calendar" && (
                <AdminCalendar
                  onOpen={
                    setDetail
                  }
                />
              )}

              {tab ===
                "bookings" && (
                <Bookings
                  onOpen={
                    setDetail
                  }
                />
              )}

              {tab ===
                "pricing" && (
                <Pricing />
              )}

              {tab ===
                "blocks" && (
                <Blocks />
              )}

              {tab ===
                "reviews" && (
                <AdminReviews />
              )}

              {tab ===
                "notifications" && (
                <Notifications />
              )}

              {tab ===
                "emails" && (
                <Emails />
              )}
            </>
          )}
        </div>
      </div>
    </AdminCtx.Provider>
  );
}

function AdminLogin({
  onIn,
}: {
  onIn: () => Promise<void>;
}) {
  const login =
    useServerFn(adminLogin);

  const [email, setEmail] =
    useState("");

  const [pw, setPw] =
    useState("");

  const [err, setErr] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const submit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setBusy(true);
    setErr("");

    try {
      const result =
        await login({
          data: {
            email:
              email.trim(),
            password: pw,
          },
        });

      if (!result.ok) {
        setErr(
          "Λάθος email ή κωδικός."
        );
        setBusy(false);
        return;
      }

      await onIn();
    } catch {
      setErr(
        "Δεν ήταν δυνατή η σύνδεση."
      );
    }

    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <form
        onSubmit={submit}
        className="panel p-8 w-full max-w-sm text-center space-y-4"
      >
        <Logo size={56} />

        <h1 className="text-3xl">
          Διαχείριση MM Home
        </h1>

        <input
          className="field"
          type="email"
          autoComplete="username"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          required
        />

        <input
          className="field"
          type="password"
          autoComplete="current-password"
          placeholder="Κωδικός"
          value={pw}
          onChange={(e) =>
            setPw(
              e.target.value
            )
          }
          required
        />

        {err && (
          <p className="text-sm text-destructive">
            {err}
          </p>
        )}

        <button
          className="btn-gold w-full"
          disabled={busy}
        >
          <Lock size={14} />

          {busy
            ? "Σύνδεση..."
            : "Σύνδεση"}
        </button>
      </form>
    </div>
  );
}

const Card = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="panel p-4">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">
      {label}
    </p>

    <p className="font-serif text-3xl mt-1">
      {value}
    </p>

    {sub && (
      <p className="text-xs text-muted-foreground">
        {sub}
      </p>
    )}
  </div>
);

function revenueOf(
  b: Booking
) {
  return b.status ===
    "confirmed"
    ? b.total
    : b.total -
        (b.refund ?? 0);
}

function Dashboard() {
  const s = useAdmin();

  const [year, setYear] =
    useState(
      new Date().getFullYear()
    );

  const months =
    useMemo(
      () =>
        Array.from(
          { length: 12 },
          (_, m) => {
            const inMonth =
              s.bookings.filter(
                (b) => {
                  const d =
                    new Date(
                      b.checkIn +
                        "T12:00"
                    );

                  return (
                    d.getFullYear() ===
                      year &&
                    d.getMonth() ===
                      m
                  );
                }
              );

            const gross =
              inMonth.reduce(
                (a, b) =>
                  a +
                  revenueOf(b),
                0
              );

            const days =
              new Date(
                year,
                m + 1,
                0
              ).getDate();

            let booked = 0;

            for (
              let d = 1;
              d <= days;
              d++
            ) {
              if (
                nightTaken(
                  toISO(
                    new Date(
                      year,
                      m,
                      d
                    )
                  ),
                  s.bookings,
                  []
                ) === "booked"
              ) {
                booked++;
              }
            }

            const conf =
              inMonth.filter(
                (b) =>
                  b.status ===
                  "confirmed"
              );

            return {
              m,
              gross,
              fees:
                feeOf(
                  gross,
                  inMonth.length
                ),
              count:
                conf.length,
              nights:
                booked,
              occ:
                Math.round(
                  (booked /
                    days) *
                    100
                ),
            };
          }
        ),
      [s.bookings, year]
    );

  const tot =
    months.reduce(
      (a, x) => ({
        gross:
          a.gross +
          x.gross,
        fees:
          a.fees +
          x.fees,
        count:
          a.count +
          x.count,
        nights:
          a.nights +
          x.nights,
      }),
      {
        gross: 0,
        fees: 0,
        count: 0,
        nights: 0,
      }
    );

  const daysYear =
    year % 4 === 0
      ? 366
      : 365;

  const max =
    Math.max(
      1,
      ...months.map(
        (x) => x.gross
      )
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() =>
            setYear(
              year - 1
            )
          }
        >
          <ChevronLeft />
        </button>

        <h2 className="text-3xl">
          {year}
        </h2>

        <button
          onClick={() =>
            setYear(
              year + 1
            )
          }
        >
          <ChevronRight />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          label="Μικτά"
          value={eur(
            tot.gross
          )}
        />

        <Card
          label="Προμήθειες"
          value={eur(
            tot.fees
          )}
          sub="προσωρινός υπολογισμός"
        />

        <Card
          label="Καθαρά"
          value={eur(
            tot.gross -
              tot.fees
          )}
        />

        <Card
          label="Κρατήσεις"
          value={String(
            tot.count
          )}
        />

        <Card
          label="Νύχτες"
          value={String(
            tot.nights
          )}
        />

        <Card
          label="Πληρότητα"
          value={`${Math.round(
            (tot.nights /
              daysYear) *
              100
          )}%`}
          sub="ετήσια"
        />
      </div>

      <div className="panel p-5">
        <p className="text-sm text-muted-foreground mb-4">
          Μηνιαία μικτά έσοδα και πληρότητα
        </p>

        <div className="flex items-end gap-2 h-44">
          {months.map(
            (x) => (
              <div
                key={x.m}
                className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
              >
                <span className="text-[10px] text-muted-foreground">
                  {x.occ}%
                </span>

                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{
                    height: `${
                      (x.gross /
                        max) *
                      100
                    }%`,
                    minHeight:
                      2,
                  }}
                  title={eur(
                    x.gross
                  )}
                />

                <span className="text-[10px]">
                  {new Date(
                    2000,
                    x.m
                  ).toLocaleString(
                    "el-GR",
                    {
                      month:
                        "narrow",
                    }
                  )}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr>
              {[
                "Μήνας",
                "Μικτά",
                "Προμήθειες",
                "Καθαρά",
                "Κρατήσεις",
                "Νύχτες",
                "Πληρότητα",
              ].map((h) => (
                <th
                  key={h}
                  className="p-3 font-normal"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {months.map(
              (x) => (
                <tr
                  key={x.m}
                  className="border-t"
                >
                  <td className="p-3">
                    {new Date(
                      2000,
                      x.m
                    ).toLocaleString(
                      "el-GR",
                      {
                        month:
                          "short",
                      }
                    )}
                  </td>

                  <td className="p-3">
                    {eur(
                      x.gross
                    )}
                  </td>

                  <td className="p-3">
                    {eur(
                      x.fees
                    )}
                  </td>

                  <td className="p-3">
                    {eur(
                      x.gross -
                        x.fees
                    )}
                  </td>

                  <td className="p-3">
                    {x.count}
                  </td>

                  <td className="p-3">
                    {x.nights}
                  </td>

                  <td className="p-3">
                    {x.occ}%
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminCalendar({
  onOpen,
}: {
  onOpen: (
    id: string
  ) => void;
}) {
  const s = useAdmin();

  const [off, setOff] =
    useState(0);

  const d = new Date();

  d.setDate(1);

  d.setMonth(
    d.getMonth() + off
  );

  const palette = [
    "#DDEEDB",
    "#DDE8F6",
    "#F4E1D7",
    "#ECE0F4",
    "#F6EDC9",
    "#D9F0EE",
    "#F3DCE6",
    "#E4E7D3",
  ];

  const confirmedBookings =
    s.bookings.filter(
      (b) =>
        b.status ===
        "confirmed"
    );

  const colourForBooking =
    (
      bookingId: string
    ) => {
      const index =
        confirmedBookings.findIndex(
          (b) =>
            b.id ===
            bookingId
        );

      return palette[
        (
          index >= 0
            ? index
            : 0
        ) %
          palette.length
      ];
    };

  const info = (
    iso: string
  ) => {
    const block =
      s.blocks.some(
        (b) =>
          iso >=
            b.start &&
          iso <=
            b.end
      );

    if (block) {
      return {
        className:
          "bg-blocked text-muted-foreground",

        mark:
          "block",

        title:
          "Μπλοκαρισμένο",
      };
    }

    const arriving =
      confirmedBookings.find(
        (b) =>
          b.checkIn ===
          iso
      );

    const departing =
      confirmedBookings.find(
        (b) =>
          b.checkOut ===
          iso
      );

    const staying =
      confirmedBookings.find(
        (b) =>
          iso >=
            b.checkIn &&
          iso <
            b.checkOut
      );

    const flex =
      flexRateFor(
        iso,
        s.overrides
      );

    if (
      arriving &&
      departing &&
      arriving.id !==
        departing.id
    ) {
      const left =
        colourForBooking(
          departing.id
        );

      const right =
        colourForBooking(
          arriving.id
        );

      return {
        className:
          "text-foreground",

        style: {
          background:
            `linear-gradient(90deg, ${left} 0%, ${left} 50%, ${right} 50%, ${right} 100%)`,
        },

        mark:
          "out · in",

        title:
          `Αναχώρηση: ${departing.name} · Άφιξη: ${arriving.name}`,
      };
    }

    if (arriving) {
      const colour =
        colourForBooking(
          arriving.id
        );

      return {
        className:
          "text-foreground",

        style: {
          background:
            `linear-gradient(90deg, transparent 0%, transparent 50%, ${colour} 50%, ${colour} 100%)`,
        },

        mark:
          "in",

        title:
          `Άφιξη: ${arriving.name}`,
      };
    }

    if (staying) {
      const colour =
        colourForBooking(
          staying.id
        );

      return {
        className:
          "text-foreground",

        style: {
          backgroundColor:
            colour,
        },

        mark:
          "",

        title:
          `Κράτηση: ${staying.name}`,
      };
    }

    if (departing) {
      const colour =
        colourForBooking(
          departing.id
        );

      return {
        className:
          "text-foreground",

        style: {
          background:
            `linear-gradient(90deg, ${colour} 0%, ${colour} 50%, transparent 50%, transparent 100%)`,
        },

        mark:
          "out",

        title:
          `Αναχώρηση: ${departing.name}`,
      };
    }

    return {
      className:
        "bg-card hover:bg-accent border",

      mark:
        `€${flex}`,

      title:
        "Διαθέσιμο",
    };
  };

  const pick = (
    iso: string
  ) => {
    const arriving =
      confirmedBookings.find(
        (b) =>
          b.checkIn ===
          iso
      );

    if (arriving) {
      onOpen(
        arriving.id
      );
      return;
    }

    const staying =
      confirmedBookings.find(
        (b) =>
          iso >=
            b.checkIn &&
          iso <
            b.checkOut
      );

    if (staying) {
      onOpen(
        staying.id
      );
      return;
    }

    const departing =
      confirmedBookings.find(
        (b) =>
          b.checkOut ===
          iso
      );

    if (departing) {
      onOpen(
        departing.id
      );
    }
  };

  return (
    <div className="panel p-6 max-w-4xl">
      <div className="flex justify-between mb-3">
        <button
          onClick={() =>
            setOff(
              off - 1
            )
          }
        >
          <ChevronLeft />
        </button>

        <button
          onClick={() =>
            setOff(
              off + 1
            )
          }
        >
          <ChevronRight />
        </button>
      </div>

      <MonthCalendar
        year={
          d.getFullYear()
      }
        month={
          d.getMonth()
        }
        locale="el-GR"
        info={info}
        onPick={pick}
      />

      <div className="flex gap-4 mt-5 text-xs flex-wrap">
        <span>
          Κάθε κράτηση έχει διαφορετικό χρώμα
        </span>

        <span>
          Μισό / μισό = αναχώρηση και νέα άφιξη την ίδια ημέρα
        </span>

        <span>
          in = άφιξη 15:00
        </span>

        <span>
          out = αναχώρηση 11:00
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Πατήστε σε χρωματισμένη ημερομηνία για να ανοίξετε την κράτηση.
      </p>
    </div>
  );
}

function Bookings({
  onOpen,
}: {
  onOpen: (
    id: string
  ) => void;
}) {
  const s = useAdmin();
  const [show, setShow] = useState(false);
  const list = [...s.bookings].sort((a, b) =>
    b.checkIn.localeCompare(a.checkIn)
  );

  return (
    <div className="space-y-4">
      <button
        className="btn-gold"
        onClick={() => setShow(!show)}
      >
        {show ? "Κλείηνο" : "+ Ηειροκίνητη κράτηση"}
      </button>

      {show && (
        <AdminManualBooking
          bookings={s.bookings}
          blocks={s.blocks}
          overrides={s.overrides}
          reload={s.reload}
          onDone={() => setShow(false)}
        />
      )}

      <div className="space-y-2">
        {list.map((b) => {
          const children = b.childAges?.length ?? 0;

          return (
            <button
              key={b.id}
              onClick={() => onOpen(b.id)}
              className="panel p-4 w-full text-left flex justify-between items-center gap-3"
            >
              <div>
                <p className="font-medium">{b.name}</p>

                <p className="text-xs text-muted-foreground">
                  {b.code} · {fd(b.checkIn)} → {fd(b.checkOut)}{" "}
                  {b.adults != null ? (
                    <>
                      · {b.adults} {b.adults === 1 ? "ενήλικας" : "ενήλικες"} ·{" "}
                      {children} {children === 1 ? "παδί" : "παιδιά"}
                    </>
                  ) : (
                    <>· {b.guests} άτομα</>
                  )}
                  {" · "}
                  {b.rate === "flexible" ? "Ευέλικτη" : "Μη επιστρέψιμη"}
                  {b.source === "manual" ? " · χειροκίνητη" : " · online"}
                </p>
              </div>

              <div className="text-right">
                <p className="font-serif text-xl">{eur(b.total)}</p>
                <p className="text-xs text-olive">
                  {b.status === "confirmed" ? "Επιβεβαιωμένη" : "Ακυρωμένη"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const s = useAdmin();
  const [editing, setEditing] = useState(false);
  const setFn = useServerFn(adminSetBookingStatus);

  const b = s.bookings.find((x) => x.id === id);

  if (!b) {
    return null;
  }

  if (editing && b.source === "manual") {
    return (
      <div className="space-y-4 max-w-2xl">
        <button
          onClick={() => setEditing(false)}
          className="text-sm flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Πίσω στα στοιχεία κράτησης
        </button>

        <AdminManualBooking
          booking={b}
          bookings={s.bookings}
          blocks={s.blocks}
          overrides={s.overrides}
          reload={s.reload}
          onDone={() => setEditing(false)}
        />
      </div>
    );
  }

  const children = b.childAges?.length ?? 0;
  const agesText =
    b.childAges && b.childAges.length > 0
      ? b.childAges.map((age) => String(age)).join(", ")
      : "—";

  const deposit = b.depositAmount ?? 0;
  const balance = Math.max(0, b.total - deposit);

  const rows: [string, string][] = [
    ["Κωδικός", b.code],
    ["Κατάσταση", b.status === "confirmed" ? "Επιβεβαιωμένη" : "Ακυρωμένη"],
    ["Επισκέπτης", b.name],
    ["Email", b.email || "—"],
    ["Κινητό", b.phone || "—"],

    ...(b.adults != null
      ? [
          ["Ενήλικες", String(b.adults)] as [string, string],
          ["Παιδιά", String(children)] as [string, string],
          ["Ηλικίες παιδιών", agesText] as [string, string],
        ]
      : [["Άτομα", String(b.guests)] as [string, string]]),

    ["Άφιξη", fd(b.checkIn) + " · 15:00"],
    ["Αναχώρηση", fd(b.checkOut) + " · 11:00"],
    ["Νύχτες", String(diffDays(b.checkIn, b.checkOut))],
    ["Τιμή", b.rate === "flexible" ? "Ευέλικτη" : "Μη επιστρέψιμη"],
    ["Σύνολο", eur(b.total)],

    ...(b.source === "manual"
      ? [
          ["Προκαταβολή", eur(deposit)] as [string, string],
          ["Υπόλοιπο", eur(balance)] as [string, string],
          ["Σημειώσεις", b.notes?.trim() || "—"] as [string, string],
        ]
      : []),

    ["Επιστροφή", b.refund != null ? eur(b.refund) : "—"],
    ["Πηγή", b.source === "manual" ? "Χειροκίνητη" : "Online"],
    ["Σύνδεσμος αξιολόγησης", `/review/${b.code}`],
  ];

  const setStatus = async (status: "confirmed" | "cancelled") => {
    const r = await setFn({
      data: {
        id: b.id,
        status,
      },
    });

    if ("error" in r && r.error) {
      alert("Οι ημερομηνίες δεν είναι πλέον διαθέσιμες.");
      return;
    }

    await s.reload();
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <button
        onClick={onBack}
        className="text-sm flex items-center gap-1"
      >
        <ChevronLeft size={16} />
        Πίσω
      </button>

      <div className="panel p-5 text-sm">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between py-2 border-b last:border-0 gap-3"
          >
            <span className="text-muted-foreground">{k}</span>
            <span className="text-right break-words max-w-[65%]">{v}</span>
          </div>
        ))}
      </div>

      {b.nightlyPrices && b.nightlyPrices.length > 0 && (
        <div className="panel p-5">
          <p className="font-medium mb-3">Τιμές ανά διανυκτέρευση</p>

          <div className="space-y-2 text-sm">
            {b.nightlyPrices.map((item) => (
              <div
                key={item.date}
                className="flex justify-between border-b last:border-0 pb-2 last:pb-0"
              >
                <span className="text-muted-foreground">{fd(item.date)}</span>
                <strong>{eur(item.price)}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {b.source === "manual" && (
          <button
            className="btn-gold"
            onClick={() => setEditing(true)}
          >
            Επεξεργασία κράτησης
          </button>
        )}

        {b.status === "confirmed" ? (
          <button
            className="btn-line"
            onClick={() => setStatus("cancelled")}
          >
            Ακύρωση κράτησης
          </button>
        ) : (
          <button
            className="btn-line"
            onClick={() => setStatus("confirmed")}
          >
            Επαναφορά κράτησης
          </button>
        )}
      </div>
    </div>
  );
}

function Pricing() {
  const s = useAdmin();

  const today =
    todayISO();

  const [f, setF] =
    useState({
      start:
        addDays(
          today,
          30
        ),
      end:
        addDays(
          today,
          33
        ),
      price: "",
      min: "",
      label: "",
    });

  const addFn =
    useServerFn(
      adminAddOverride
    );

  const rmFn =
    useServerFn(
      adminRemoveOverride
    );

  const add =
    async () => {
      if (
        f.end <
          f.start ||
        (!f.price &&
          !f.min)
      ) {
        return;
      }

      await addFn({
        data: {
          start:
            f.start,
          end:
            f.end,
          ...(f.price
            ? {
                price:
                  +f.price,
              }
            : {}),
          ...(f.min
            ? {
                minNights:
                  +f.min,
              }
            : {}),
          label:
            f.label,
        },
      });

      await s.reload();

      setF({
        ...f,
        price: "",
        min: "",
        label: "",
      });
    };

  return (
    <div className="space-y-4">
      <div className="panel p-5 text-sm">
        Βασική τιμή: Ευέλικτη €200 ·
        Μη επιστρέψιμη €180 ·
        Ελάχιστη διαμονή 2 νύχτες ·
        Καθαρισμός περιλαμβάνεται.
      </div>

      <div className="panel p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-xs">
          Από

          <input
            type="date"
            className="field"
            value={
              f.start
            }
            onChange={(e) =>
              setF({
                ...f,
                start:
                  e.target.value,
              })
            }
          />
        </label>

        <label className="text-xs">
          Έως και

          <input
            type="date"
            className="field"
            value={
              f.end
            }
            onChange={(e) =>
              setF({
                ...f,
                end:
                  e.target.value,
              })
            }
          />
        </label>

        <input
          className="field"
          type="number"
          placeholder="Ευέλικτη τιμή € / νύχτα"
          value={f.price}
          onChange={(e) =>
            setF({
              ...f,
              price:
                e.target.value,
            })
          }
        />

        <input
          className="field"
          type="number"
          placeholder="Ελάχιστες νύχτες"
          value={f.min}
          onChange={(e) =>
            setF({
              ...f,
              min:
                e.target.value,
            })
          }
        />

        <input
          className="field"
          placeholder="Εσωτερική σημείωση"
          value={f.label}
          onChange={(e) =>
            setF({
              ...f,
              label:
                e.target.value,
            })
          }
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {f.price
              ? `Μη επιστρέψιμη: €${nonRefOf(
                  +f.price
                )}`
              : ""}
          </span>

          <button
            className="btn-gold"
            onClick={add}
          >
            Εφαρμογή
          </button>
        </div>
      </div>

      {s.overrides.map(
        (o) => (
          <div
            key={o.id}
            className="panel p-4 flex justify-between items-center gap-3 text-sm"
          >
            <div>
              <p>
                {fd(
                  o.start
                )}{" "}
                →{" "}
                {fd(
                  o.end
                )}

                {o.label && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {o.label}
                  </span>
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                {o.price
                  ? `Ευέλικτη €${o.price} / Μη επιστρέψιμη €${nonRefOf(
                      o.price
                    )}`
                  : "Βασική τιμή"}{" "}
                ·{" "}
                {o.minNights
                  ? `ελάχιστο ${o.minNights} νύχτες`
                  : "βασικό ελάχιστο"}
              </p>
            </div>

            <button
              className="text-destructive text-xs"
              onClick={
                async () => {
                  await rmFn({
                    data: {
                      id: o.id,
                    },
                  });

                  await s.reload();
                }
              }
            >
              Αφαίρεση
            </button>
          </div>
        )
      )}

      <p className="text-xs text-muted-foreground">
        Έλεγχος τιμής σε 30 ημέρες:
        Ευέλικτη €
        {flexRateFor(
          addDays(
            today,
            30
          ),
          s.overrides
        )}{" "}
        · ελάχιστο{" "}
        {minNightsFor(
          addDays(
            today,
            30
          ),
          s.overrides
        )}{" "}
        νύχτες.
      </p>
    </div>
  );
}

function Blocks() {
  const s = useAdmin();

  const today =
    todayISO();

  const [f, setF] =
    useState({
      start:
        addDays(
          today,
          14
        ),
      end:
        addDays(
          today,
          16
        ),
      reason: "",
    });

  const addFn =
    useServerFn(
      adminAddBlock
    );

  const rmFn =
    useServerFn(
      adminRemoveBlock
    );

  const add =
    async () => {
      if (
        f.end <
        f.start
      ) {
        return;
      }

      const result =
        await addFn({
          data: {
            start:
              f.start,
            end:
              f.end,
            reason:
              f.reason,
          },
        });

      if (
        "error" in
          result &&
        result.error
      ) {
        alert(
          result.error ===
            "taken"
            ? "Οι ημερομηνίες δεν είναι διαθέσιμες."
            : "Δεν ήταν δυνατό το μπλοκάρισμα."
        );
        return;
      }

      await s.reload();

      setF({
        ...f,
        reason: "",
      });
    };

  return (
    <div className="space-y-4">
      <div className="panel p-5 grid sm:grid-cols-2 gap-3">
        <label className="text-xs">
          Πρώτη μπλοκαρισμένη ημερομηνία

          <input
            type="date"
            className="field"
            value={
              f.start
            }
            onChange={(e) =>
              setF({
                ...f,
                start:
                  e.target.value,
              })
            }
          />
        </label>

        <label className="text-xs">
          Τελευταία μπλοκαρισμένη ημερομηνία

          <input
            type="date"
            className="field"
            value={
              f.end
            }
            onChange={(e) =>
              setF({
                ...f,
                end:
                  e.target.value,
              })
            }
          />
        </label>

        <input
          className="field sm:col-span-2"
          placeholder="Εσωτερικός λόγος — δεν εμφανίζεται στους επισκέπτες"
          value={f.reason}
          onChange={(e) =>
            setF({
              ...f,
              reason:
                e.target.value,
            })
          }
        />

        <button
          className="btn-gold sm:col-span-2"
          onClick={add}
        >
          Μπλοκάρισμα ημερομηνιών
        </button>
      </div>

      {s.blocks.map(
        (b) => (
          <div
            key={b.id}
            className="panel p-4 flex justify-between items-center text-sm gap-3"
          >
            <div>
              <p>
                {fd(
                  b.start
                )}{" "}
                →{" "}
                {fd(
                  b.end
                )}
              </p>

              <p className="text-xs text-muted-foreground">
                {b.reason}
              </p>
            </div>

            <button
              className="text-xs text-destructive"
              onClick={
                async () => {
                  await rmFn({
                    data: {
                      id: b.id,
                    },
                  });

                  await s.reload();
                }
              }
            >
              Ξεμπλοκάρισμα
            </button>
          </div>
        )
      )}
    </div>
  );
}

function ReviewsMod() {
  const s = useStore();

  const set = (
    id: string,
    status:
      | "approved"
      | "rejected"
      | "pending"
  ) =>
    update((st) => ({
      ...st,
      reviews:
        st.reviews.map(
          (r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                }
              : r
        ),
    }));

  const statusLabel = (
    st: string
  ) =>
    st === "pending"
      ? "Σε αναμονή"
      : st === "approved"
      ? "Εγκεκριμένες"
      : "Απορριφθείσες";

  return (
    <div className="space-y-3">
      {[
        "pending",
        "approved",
        "rejected",
      ].map((st) => (
        <div key={st}>
          <p className="eyebrow my-3">
            {statusLabel(st)}
          </p>

          {s.reviews
            .filter(
              (r) =>
                r.status ===
                st
            )
            .map((r) => (
              <div
                key={r.id}
                className="panel p-4 mb-2 text-sm"
              >
                <div className="flex justify-between">
                  <span>
                    {r.name} ·{" "}
                    {"★".repeat(
                      r.rating
                    )}
                  </span>

                  {r.sample && (
                    <span className="text-xs text-primary">
                      ΔΕΙΓΜΑ
                    </span>
                  )}
                </div>

                <p className="mt-2 text-muted-foreground">
                  {r.text}
                </p>

                <div className="flex gap-3 mt-3 text-xs">
                  {st !==
                    "approved" && (
                    <button
                      className="text-olive"
                      onClick={() =>
                        set(
                          r.id,
                          "approved"
                        )
                      }
                    >
                      Έγκριση
                    </button>
                  )}

                  {st !==
                    "rejected" && (
                    <button
                      className="text-destructive"
                      onClick={() =>
                        set(
                          r.id,
                          "rejected"
                        )
                      }
                    >
                      Απόρριψη
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
}

function Notifications() {
  const { settings } =
    useStore();

  const set = (
    p: Partial<
      typeof settings
    >
  ) =>
    update((st) => ({
      ...st,
      settings: {
        ...st.settings,
        ...p,
      },
    }));

  return (
    <div className="panel p-5 space-y-4 max-w-xl text-sm">
      <p className="font-serif text-2xl">
        Ειδοποιήσεις νέας κράτησης
      </p>

      <label className="flex items-center justify-between">
        Ειδοποίηση μέσω email

        <input
          type="checkbox"
          className="accent-primary scale-125"
          checked={
            settings.notifyEmail
          }
          onChange={(e) =>
            set({
              notifyEmail:
                e.target.checked,
            })
          }
        />
      </label>

      <input
        className="field"
        value={
          settings.ownerEmail
        }
        onChange={(e) =>
          set({
            ownerEmail:
              e.target.value,
          })
        }
      />

      <label className="flex items-center justify-between">
        Push ειδοποίηση στο κινητό

        <input
          type="checkbox"
          className="accent-primary scale-125"
          checked={
            settings.notifyPush
          }
          onChange={(e) =>
            set({
              notifyPush:
                e.target.checked,
            })
          }
        />
      </label>

      <p className="text-xs text-muted-foreground">
        Οι ειδοποιήσεις αυτές δεν έχουν ενεργοποιηθεί ακόμη.
      </p>

      <hr />

      <p className="font-serif text-2xl">
        Δημόσια στοιχεία
      </p>

      <label className="block">
        Διεύθυνση

        <input
          className="field mt-1"
          value={
            settings.address
          }
          onChange={(e) =>
            set({
              address:
                e.target.value,
            })
          }
        />
      </label>

      <label className="block">
        Τηλέφωνο / Viber

        <input
          className="field mt-1"
          value={
            settings.phone
          }
          onChange={(e) =>
            set({
              phone:
                e.target.value,
            })
          }
        />
      </label>
    </div>
  );
}

function Emails() {
  const s = {
    ...useStore(),
    ...useAdmin(),
  };

  const b =
    s.bookings.find(
      (x) =>
        x.status ===
          "confirmed" &&
        x.checkIn >=
          todayISO()
    ) ??
    s.bookings[0];

  const [which, setWhich] =
    useState(0);

  if (!b) {
    return (
      <div className="panel p-5">
        Δεν υπάρχουν ακόμη κρατήσεις για προεπισκόπηση email.
      </div>
    );
  }

  const list = [
    {
      t: "Επιβεβαίωση προς επισκέπτη",
      subj: `Η κράτησή σας στο MM Home ${b.code} επιβεβαιώθηκε`,
      body: [
        `Αγαπητέ/ή ${b.name},`,
        `Σας ευχαριστούμε που επιλέξατε το MM Home. Η διαμονή σας από ${fd(
          b.checkIn
        )} έως ${fd(
          b.checkOut
        )} για ${b.guests} επισκέπτες έχει επιβεβαιωθεί.`,
        `Τιμή: ${
          b.rate ===
          "flexible"
            ? "Ευέλικτη"
            : "Μη επιστρέψιμη"
        } · Σύνολο: ${eur(
          b.total
        )}.`,
        "Προσωπικό check-in από τις 15:00. Αναχώρηση έως τις 11:00.",
        `Κωδικός κράτησης: ${b.code}.`,
      ],
    },

    {
      t: "Νέα κράτηση προς ιδιοκτήτη",
      subj: `Νέα κράτηση MM Home ${b.code}`,
      body: [
        `${b.name} · ${b.email} · ${b.phone}`,
        `${fd(
          b.checkIn
        )} → ${fd(
          b.checkOut
        )} · ${b.guests} επισκέπτες`,
        `Σύνολο ${eur(
          b.total
        )}`,
      ],
    },

    {
      t: "Πριν την άφιξη",
      subj:
        "Η διαμονή σας στο MM Home πλησιάζει",
      body: [
        `Αγαπητέ/ή ${b.name},`,
        `Σας περιμένουμε στις ${fd(
          b.checkIn
        )}. Το προσωπικό check-in είναι διαθέσιμο από τις 15:00.`,
        `Για οτιδήποτε χρειαστείτε, επικοινωνήστε μαζί μας στο ${s.settings.phone} ή στο info@mmhome.gr.`,
      ],
    },

    {
      t: "Μετά την αναχώρηση",
      subj:
        "Ευχαριστούμε που επιλέξατε το MM Home",
      body: [
        `Αγαπητέ/ή ${b.name},`,
        "Ευχαριστούμε που επιλέξατε το MM Home!",
        `Θα χαρούμε να μοιραστείτε την εμπειρία σας: https://mmhome.gr/review/${b.code}`,
      ],
    },
  ];

  const e =
    list[which];

  if (!e) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {list.map(
          (x, i) => (
            <button
              key={x.t}
              onClick={() =>
                setWhich(i)
              }
              className={`px-3 py-1.5 rounded-full text-xs border ${
                i === which
                  ? "bg-foreground text-background"
                  : ""
              }`}
            >
              {x.t}
            </button>
          )
        )}
      </div>

      <div className="panel max-w-xl overflow-hidden">
        <div className="bg-secondary p-6 text-center">
          <Logo />

          <p className="font-serif text-2xl mt-2">
            MM Home
          </p>

          <p className="font-serif italic text-sm text-muted-foreground">
            {SLOGAN}
          </p>
        </div>

        <div className="p-6 text-sm space-y-3">
          <p className="text-xs text-muted-foreground">
            Θέμα: {e.subj}
          </p>

          {e.body.map(
            (p) => (
              <p key={p}>
                {p}
              </p>
            )
          )}

          <p className="pt-2">
            — MM Home
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Προεπισκόπηση μόνο — τα email δεν αποστέλλονται ακόμη.
      </p>
    </div>
  );
}
