// Official MM Home property photos. Each slot is independently replaceable (swap the file or the import).
import livingPrimary from "@/assets/living-primary.png.asset.json"; // approved Oct 2026 primary/hero image
const living1 = livingPrimary.url;
import living2 from "@/assets/room-living-2.jpg";
import master1 from "@/assets/room-master-1.jpg";
import master2 from "@/assets/room-master-2.jpg";
import master3 from "@/assets/room-master-3.jpg";
import bed2a from "@/assets/room-bedroom2-1.jpg";
import bed2b from "@/assets/room-bedroom2-2.jpg";
import bed2c from "@/assets/room-bedroom2-3.jpg";
import bed3a from "@/assets/room-bedroom3-1.jpg";
import bed3b from "@/assets/room-bedroom3-2.jpg";
import kitchen from "@/assets/room-kitchen.jpg";
import dining from "@/assets/room-dining.jpg"; // temporary, easy to replace
import bath1 from "@/assets/room-bathroom-1.jpg";
import bath2 from "@/assets/room-bathroom-2.jpg";
import wc from "@/assets/room-wc-laundry.jpg";
import front from "@/assets/room-front-balcony.jpg";
import rear from "@/assets/room-rear-balcony.jpg";

export const photos = { living: living1, bedroom: master1, balcony: front, kitchen, dining };

export const roomPhotos = {
  living: [{ id: "living-primary", src: living1 }, { id: "living-detail-1", src: living2 }],
  master: [{ id: "master-primary", src: master1 }, { id: "master-detail-1", src: master2 }, { id: "master-detail-2", src: master3 }],
  bedroom2: [{ id: "bedroom2-primary", src: bed2a }, { id: "bedroom2-detail-1", src: bed2b }, { id: "bedroom2-detail-2", src: bed2c }],
  bedroom3: [{ id: "bedroom3-primary", src: bed3a }, { id: "bedroom3-detail", src: bed3b }],
  kitchen: [{ id: "kitchen-primary", src: kitchen }],
  dining: [{ id: "dining-primary", src: dining }],
  bathroom: [{ id: "bathroom-primary", src: bath1 }, { id: "bathroom-detail", src: bath2 }],
  laundry: [{ id: "wc-laundry-primary", src: wc }],
  front: [{ id: "front-balcony-primary", src: front }],
  rear: [{ id: "rear-balcony-primary", src: rear }],
};
