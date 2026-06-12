// Re-exports so admin tables stay decoupled from the mock data path.
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
export { triageCategories, scheduleItems, resources } from "@/data/mock";
export const SUPPORTED_LANGUAGES_LIST = SUPPORTED_LANGUAGES;
