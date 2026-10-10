import { useT } from "@/lib/i18n";

export function RoomGallery({ images, title }: { images: { id: string; src: string }[]; title: string }) {
  const { lang } = useT();
  return <div aria-label={title} className={`grid gap-3 ${images.length === 3 ? "md:grid-cols-[2fr_1fr] md:grid-rows-2 md:h-[520px]" : images.length === 2 ? "md:grid-cols-2" : ""}`}>
    {images.map((image, i) => <div key={image.id} data-image-slot={image.id} className={`relative overflow-hidden rounded-lg bg-secondary ${images.length === 3 ? i === 0 ? "aspect-[4/3] md:aspect-auto md:row-span-2" : "aspect-[16/9] md:aspect-auto" : "aspect-[4/3]"}`}>
      {image.src ? <img src={image.src} alt={`${title} · ${i + 1}`} loading="lazy" width={1408} height={1008} className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-muted-foreground"><p>{title}<span className="block mt-2 text-sm">{lang === "el" ? "Αναμονή επίσημης φωτογραφίας" : "Awaiting property photo"}</span></p></div>}
    </div>)}
  </div>;
}