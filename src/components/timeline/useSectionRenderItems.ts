import { useMemo } from "react";
import {
  useRepositoryStore,
  repoSelectors,
} from "../../store/repositoryStore";
import type { SectionRenderItem } from "./SectionLane";

export const useSectionRenderItems = (): SectionRenderItem[] => {
  const sectionOrder = useRepositoryStore((s) => s.sectionOrder);
  const sections = useRepositoryStore((s) => s.sections);
  const playlistBars = useRepositoryStore((s) => s.playlistBars);

  return useMemo(() => {
    const items: SectionRenderItem[] = [];
    const sectionsList = sectionOrder.map((id) => sections[id]).filter(Boolean);
    for (const section of sectionsList) {
      if (section.barIds.length === 0) continue;
      const secBars = section.barIds
        .map((id) => playlistBars[id])
        .filter(Boolean);
      if (secBars.length === 0) continue;

      items.push({
        section,
        startPPQ: Math.min(...secBars.map((b) => b!.startPPQ)),
        endPPQ: Math.max(...secBars.map((b) => b!.endPPQ)),
      });
    }
    return items;
  }, [sectionOrder, sections, playlistBars]);
};
