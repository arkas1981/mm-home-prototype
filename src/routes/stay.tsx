import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useT,
} from "@/lib/i18n";

import {
  roomPhotos,
} from "@/lib/photos";

import {
  RoomGallery,
} from "@/components/RoomGallery";

import {
  Button,
} from "@/components/ui/button";

import {
  meta,
} from "@/lib/meta";

import {
  PageTitle,
} from "@/components/site";

export const Route =
  createFileRoute(
    "/stay"
  )({
    head: () =>
      meta(
        "Διαμονή στα Τρίκαλα | 3 υπνοδωμάτια — MM Home",
        "Δείτε τους χώρους του MM Home: 3 υπνοδωμάτια, σαλόνι, πλήρως εξοπλισμένη κουζίνα, δύο μπάνια και δύο μπαλκόνια στο κέντρο των Τρικάλων."
      ),
    component: Stay,
  });

function Block({
  images,
  title,
  children,
}: {
  images: {
    id: string;
    src: string;
  }[];
  title: string;
  children?:
    React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 mb-20">
      <div className="mb-8 max-w-2xl">
        <h2 className="text-4xl">
          {title}
        </h2>

        {children && (
          <div className="mt-3 text-muted-foreground leading-relaxed space-y-2">
            {children}
          </div>
        )}
      </div>

      <RoomGallery
        images={images}
        title={title}
      />
    </section>
  );
}

function Stay() {
  const { t } =
    useT();

  const s =
    t.stay;

  return (
    <>
      <PageTitle
        title={s.title}
        sub={s.sub}
      />

      <Block
        images={
          roomPhotos.living
        }
        title={
          s.livingT
        }
      >
        <p>
          {s.living}
        </p>
      </Block>

      <section className="mx-auto max-w-7xl px-5 mb-10">
        <h2 className="text-4xl">
          {s.bedsT}
        </h2>

        <div className="mt-4 max-w-3xl text-muted-foreground space-y-3 leading-relaxed">
          <p>
            {s.beds}
          </p>

          <p>
            {s.smart}
          </p>
        </div>
      </section>

      <Block
        images={
          roomPhotos.master
        }
        title={
          s.master
        }
      />

      <Block
        images={
          roomPhotos.bedroom2
        }
        title={
          s.bedroom2
        }
      />

      <Block
        images={
          roomPhotos.bedroom3
        }
        title={
          s.bedroom3
        }
      />

      <section className="mx-auto max-w-7xl px-5 mb-20 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-4xl">
            {s.kitchenT}
          </h2>

          <p className="mt-3 text-muted-foreground leading-relaxed">
            {s.kitchen}
          </p>

          <p className="mt-3 mb-6 text-muted-foreground">
            {s.welcome}
          </p>

          <RoomGallery
            images={
              roomPhotos.kitchen
            }
            title={
              s.kitchenT
            }
          />
        </div>

        <div>
          <h2 className="text-4xl">
            {s.diningT}
          </h2>

          <p className="mt-3 mb-6 text-muted-foreground leading-relaxed">
            {s.dining}
          </p>

          <RoomGallery
            images={
              roomPhotos.dining
            }
            title={
              s.diningT
            }
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 mb-8">
        <h2 className="text-4xl">
          {s.bathroomsT}
        </h2>
      </section>

      <Block
        images={
          roomPhotos.bathroom
        }
        title={
          s.bathroomT
        }
      >
        <p>
          {s.bathroom}
        </p>
      </Block>

      <Block
        images={
          roomPhotos.laundry
        }
        title={
          s.wcT
        }
      >
        <p>
          {s.wc}
        </p>
      </Block>

      <section className="mx-auto max-w-7xl px-5 mb-20">
        <h2 className="text-4xl mb-8 max-w-3xl">
          {s.outT}
        </h2>

        <div className="grid md:grid-cols-2 gap-10">
          {[
            {
              images:
                roomPhotos.front,
              title:
                s.frontT,
              body:
                s.outFront,
            },
            {
              images:
                roomPhotos.rear,
              title:
                s.rearT,
              body:
                s.outRear,
            },
          ].map(
            ({
              images,
              title,
              body,
            }) => (
              <div
                key={
                  title
                }
              >
                <h3 className="text-3xl">
                  {title}
                </h3>

                <p className="mt-3 mb-6 text-muted-foreground leading-relaxed">
                  {body}
                </p>

                <RoomGallery
                  images={
                    images
                  }
                  title={
                    title
                  }
                />
              </div>
            )
          )}
        </div>
      </section>

      <div className="text-center">
        <Button
          asChild
          className="btn-gold h-auto"
        >
          <Link
            to="/book"
          >
            {t.common.bookNow}
          </Link>
        </Button>
      </div>
    </>
  );
}
