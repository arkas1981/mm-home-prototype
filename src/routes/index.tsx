import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  SLOGAN,
  useT,
} from "@/lib/i18n";

import {
  photos,
  roomPhotos,
} from "@/lib/photos";

import {
  meta,
} from "@/lib/meta";

const title =
  "MM Home | Πολυτελές διαμέρισμα στο κέντρο των Τρικάλων";

const description =
  "Πλήρως ανακαινισμένο διαμέρισμα 94 m² στο κέντρο των Τρικάλων, με 3 υπνοδωμάτια, έως 6 επισκέπτες, Fiber Wi-Fi και σύγχρονες παροχές.";

function absoluteImageUrl(
  src: string
) {
  if (
    src.startsWith(
      "http://"
    ) ||
    src.startsWith(
      "https://"
    )
  ) {
    return src;
  }

  return `https://mmhome.gr${
    src.startsWith("/")
      ? ""
      : "/"
  }${src}`;
}

const structuredImages = [
  roomPhotos.living[0]?.src,
  roomPhotos.living[1]?.src,
  roomPhotos.master[0]?.src,
  roomPhotos.master[1]?.src,
  roomPhotos.bedroom2[0]?.src,
  roomPhotos.bedroom3[0]?.src,
  roomPhotos.kitchen[0]?.src,
  roomPhotos.bathroom[0]?.src,
  roomPhotos.front[0]?.src,
  roomPhotos.rear[0]?.src,
]
  .filter(
    (src): src is string =>
      Boolean(src)
  )
  .map(
    absoluteImageUrl
  );

const structuredData = {
  "@context":
    "https://schema.org",

  "@type":
    "VacationRental",

  additionalType:
    "Apartment",

  identifier:
    "mmhome-trikala",

  name:
    "MM Home",

  url:
    "https://mmhome.gr/",

  description,

  image:
    structuredImages,

  telephone:
    "+306984684411",

  email:
    "info@mmhome.gr",

  address: {
    "@type":
      "PostalAddress",

    streetAddress:
      "Ασκληπιού 44",

    addressLocality:
      "Τρίκαλα",

    addressRegion:
      "Θεσσαλία",

    postalCode:
      "42131",

    addressCountry:
      "GR",
  },

  geo: {
    "@type":
      "GeoCoordinates",

    latitude:
      39.550449832990786,

    longitude:
      21.765204641597695,
  },

  checkinTime:
    "15:00:00",

  checkoutTime:
    "11:00:00",

  knowsLanguage: [
    "el-GR",
    "en",
  ],

  containsPlace: {
    "@type":
      "Accommodation",

    additionalType:
      "EntirePlace",

    occupancy: {
      "@type":
        "QuantitativeValue",

      value:
        6,
    },

    floorSize: {
      "@type":
        "QuantitativeValue",

      value:
        94,

      unitCode:
        "MTK",
    },

    numberOfBedrooms:
      3,

    numberOfBathroomsTotal:
      2,

    bed: [
      {
        "@type":
          "BedDetails",

        numberOfBeds:
          2,

        typeOfBed:
          "Queen",
      },

      {
        "@type":
          "BedDetails",

        numberOfBeds:
          1,

        typeOfBed:
          "Double",
      },
    ],
  },

  amenityFeature: [
    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "wifi",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "internetType",

      value:
        "Free",
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "kitchen",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "ac",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "heating",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "balcony",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "elevator",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "fireplace",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "microwave",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "ovenStove",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "tv",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "washerDryer",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "instantBookable",

      value:
        true,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "petsAllowed",

      value:
        false,
    },

    {
      "@type":
        "LocationFeatureSpecification",

      name:
        "smokingAllowed",

      value:
        false,
    },
  ],
};

export const Route =
  createFileRoute("/")({
    head: () => {
      const seo =
        meta(
          title,
          description
        );

      return {
        ...seo,

        scripts: [
          {
            type:
              "application/ld+json",

            children:
              JSON.stringify(
                structuredData
              ),
          },
        ],
      };
    },

    component:
      Home,
  });

function Home() {
  const {
    t,
  } = useT();

  return (
    <>
      <section className="relative min-h-[620px] md:min-h-[660px] h-[78svh] overflow-hidden">
        <img
          src={
            photos.living
          }
          alt="MM Home πολυτελές διαμέρισμα στο κέντρο των Τρικάλων"
          width={1600}
          height={1008}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-foreground/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent" />

        <div className="relative z-10 mx-auto max-w-7xl h-full px-5 flex flex-col justify-end pb-10 md:pb-16 text-background fade-up">
          <p className="font-serif text-3xl">
            MM Home
          </p>

          <h1 className="mt-4 text-4xl md:text-6xl max-w-4xl leading-[1.08]">
            {
              t.home
                .headline
            }
          </h1>

          <p className="mt-4 text-base md:text-lg max-w-xl">
            {
              t.home
                .supporting
            }
          </p>

          <p className="mt-4 text-sm md:text-base">
            {
              t.home
                .heroFacts
            }
          </p>

          <p className="mt-3 font-serif italic text-xl">
            {SLOGAN}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/book"
              className="btn-gold"
            >
              {
                t.common
                  .bookNow
              }
            </Link>

            <Link
              to="/stay"
              className="btn-line !border-background !text-background hover:!bg-background hover:!text-foreground"
            >
              {
                t.home
                  .explore
              }
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-6 md:pt-10 grid md:grid-cols-3 gap-4">
        {[
          {
            src:
              photos.kitchen,

            alt:
              t.stay
                .kitchenT,
          },

          {
            src:
              photos.dining,

            alt:
              t.stay
                .diningT,
          },

          {
            src:
              photos.balcony,

            alt:
              t.stay
                .frontT,
          },
        ].map(
          (p) => (
            <img
              key={
                p.alt
              }
              src={
                p.src
              }
              alt={
                p.alt
              }
              loading="lazy"
              width={1408}
              height={1008}
              className="rounded-2xl w-full h-[300px] md:h-[360px] object-cover"
            />
          )
        )}
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 md:py-20 text-center">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-y-6 text-sm tracking-wide text-muted-foreground">
          {t.home.facts.map(
            (f) => (
              <div
                key={
                  f
                }
                className="border-l first:border-l-0 md:px-2"
              >
                {f}
              </div>
            )
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="eyebrow">
            {
              t.nav
                .location
            }
          </p>

          <h2 className="mt-3 text-4xl md:text-5xl">
            {
              t.home
                .walkTitle
            }
          </h2>

          <p className="mt-5 text-muted-foreground leading-relaxed">
            {
              t.home
                .walk
            }
          </p>

          <Link
            to="/location"
            className="btn-line mt-8"
          >
            {
              t.nav
                .location
            }
          </Link>
        </div>

        <img
          src="/τρικαλα.jpg"
          alt="Κέντρο Τρικάλων κοντά στο MM Home"
          loading="lazy"
          width={1408}
          height={1008}
          className="rounded-2xl w-full h-[460px] object-cover"
        />
      </section>
    </>
  );
}
