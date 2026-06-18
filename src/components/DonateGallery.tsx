import p1 from "@/assets/donate-gallery/place1.jpg.asset.json";
import p2 from "@/assets/donate-gallery/place2.jpg.asset.json";
import p3 from "@/assets/donate-gallery/place3.jpg.asset.json";
import p4 from "@/assets/donate-gallery/place4.jpg.asset.json";
import p5 from "@/assets/donate-gallery/place5.jpg.asset.json";
import p6 from "@/assets/donate-gallery/place6.jpg.asset.json";
import p7 from "@/assets/donate-gallery/place7.jpg.asset.json";
import p8 from "@/assets/donate-gallery/place8.jpg.asset.json";
import p9 from "@/assets/donate-gallery/place9.jpg.asset.json";
import p10 from "@/assets/donate-gallery/place10.jpg.asset.json";

const images: { url: string }[] = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] as { url: string }[];

export function DonateGallery() {
  const loop = [...images, ...images];
  return (
    <div
      className="group relative overflow-hidden rounded-2xl"
      aria-label="Photos from The PLACE community"
    >
      <div
        className="flex w-max gap-4 animate-[marquee_45s_linear_infinite] group-hover:[animation-play-state:paused]"
      >
        {loop.map((img, i) => (
          <img
            key={i}
            src={img.url}
            alt="The PLACE community"
            loading="lazy"
            className="h-48 w-72 shrink-0 rounded-xl object-cover md:h-56 md:w-80"
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" />
    </div>
  );
}
