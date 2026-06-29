import food from "@/assets/resource-categories/food.jpg.asset.json";
import housing from "@/assets/resource-categories/housing.jpg.asset.json";
import jobs from "@/assets/resource-categories/jobs.jpg.asset.json";
import transportation from "@/assets/resource-categories/transportation.jpg.asset.json";
import health from "@/assets/resource-categories/health.jpg.asset.json";
import legal from "@/assets/resource-categories/legal.jpg.asset.json";
import immigration from "@/assets/resource-categories/immigration.jpg.asset.json";
import education from "@/assets/resource-categories/education.jpg.asset.json";
import english from "@/assets/resource-categories/english.jpg.asset.json";
import family from "@/assets/resource-categories/family.jpg.asset.json";
import emergency from "@/assets/resource-categories/emergency.jpg.asset.json";
import government from "@/assets/resource-categories/government.jpg.asset.json";
import community from "@/assets/resource-categories/community.jpg.asset.json";
import tax from "@/assets/resource-categories/tax.jpg.asset.json";

const map: Record<string, { url: string }> = {
  Food: food,
  Housing: housing,
  Jobs: jobs,
  Transportation: transportation,
  Health: health,
  "Legal Help": legal,
  "Immigration Help": immigration,
  Education: education,
  "English Classes": english,
  "Child and Family Support": family,
  "Emergency Help": emergency,
  "Government Services": government,
  "Other Community Resources": community,
  "Tax Assistance": tax,
};

export function categoryImage(category: string | null | undefined): string {
  if (!category) return community.url;
  return (map[category] ?? community).url;
}
