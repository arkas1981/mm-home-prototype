import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useT } from "@/lib/i18n";

type GalleryImage = {
  id: string;
  src: string;
};

export function RoomGallery({
  images,
  title,
}: {
  images: GalleryImage[];
  title: string;
}) {
  const { lang } = useT();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const validImages = images.filter((image) => image.src);

  if (validImages.length === 0) {
    return (
      <div className="aspect-[4/3] rounded-lg bg-secondary flex items-center justify-center px-5 text-center text-muted-foreground">
        <p>
          {title}
          <span className="block mt-2 text-sm">
            {lang === "el"
              ? "Αναμονή επίσημης φωτογραφίας"
              : "Awaiting property photo"}
          </span>
        </p>
      </div>
    );
  }

  const previous = () => {
    setCurrent((current - 1 + validImages.length) % validImages.length);
  };

  const next = () => {
    setCurrent((current + 1) % validImages.length);
  };

  const openGallery = () => {
    setCurrent(0);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowLeft") previous();
      if (event.key === "ArrowRight") next();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, current]);

  return (
    <>
      <div aria-label={title}>
        <div
          data-image-slot={validImages[0].id}
          className="relative overflow-hidden rounded-lg bg-secondary aspect-[4/3]"
        >
          <img
            src={validImages[0].src}
            alt={`${title} · 1`}
            loading="lazy"
            width={1408}
            height={1008}
            className="h-full w-full object-cover"
          />
        </div>

        {validImages.length > 1 && (
          <div className="mt-5">
            <button
              type="button"
              onClick={openGallery}
              className="btn-line"
            >
              {lang === "el"
                ? `Δείτε περισσότερες φωτογραφίες (${validImages.length})`
                : `View more photos (${validImages.length})`}
            </button>
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-5 right-5 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            aria-label={lang === "el" ? "Κλείσιμο" : "Close"}
          >
            <X size={28} />
          </button>

          {validImages.length > 1 && (
            <button
              type="button"
              onClick={previous}
              className="absolute left-3 md:left-8 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label={lang === "el" ? "Προηγούμενη" : "Previous"}
            >
              <ChevronLeft size={34} />
            </button>
          )}

          <div className="w-full max-w-6xl px-14 md:px-20">
            <img
              src={validImages[current].src}
              alt={`${title} · ${current + 1}`}
              className="max-h-[82vh] w-full object-contain"
            />

            <div className="mt-5 text-center text-white">
              <p className="font-serif text-xl">{title}</p>

              {validImages.length > 1 && (
                <p className="mt-1 text-sm text-white/70">
                  {current + 1} / {validImages.length}
                </p>
              )}
            </div>
          </div>

          {validImages.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-3 md:right-8 z-20 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              aria-label={lang === "el" ? "Επόμενη" : "Next"}
            >
              <ChevronRight size={34} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
