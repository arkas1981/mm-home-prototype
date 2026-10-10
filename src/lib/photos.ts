// Placeholder photography. Replace these files (same names) or update imports when final photos arrive.
import living from "@/assets/photo-living.jpg";
import bedroom from "@/assets/photo-bedroom.jpg";
import balcony from "@/assets/photo-balcony.jpg";
import kitchen from "@/assets/photo-kitchen.jpg";

export const photos = { living, bedroom, balcony, kitchen };

// Each key is an independent replacement slot; existing images are temporary.
export const roomPhotos = {
  living: [{ id: "living-primary", src: living }, { id: "living-detail-1", src: living }, { id: "living-detail-2", src: living }],
  master: [{ id: "master-primary", src: bedroom }, { id: "master-detail-1", src: bedroom }, { id: "master-detail-2", src: bedroom }],
  bedroom2: [{ id: "bedroom2-primary", src: bedroom }, { id: "bedroom2-detail-1", src: bedroom }, { id: "bedroom2-detail-2", src: bedroom }],
  bedroom3: [{ id: "bedroom3-primary", src: bedroom }, { id: "bedroom3-detail", src: bedroom }],
  kitchen: [{ id: "kitchen-primary", src: kitchen }],
  dining: [{ id: "dining-primary", src: kitchen }],
  bathroom: [{ id: "bathroom-primary", src: "" }, { id: "bathroom-detail", src: "" }],
  laundry: [{ id: "wc-laundry-primary", src: "" }],
  front: [{ id: "front-balcony-primary", src: balcony }],
  rear: [{ id: "rear-balcony-primary", src: balcony }],
};
