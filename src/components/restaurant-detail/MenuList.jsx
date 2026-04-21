import { useEffect, useMemo, useRef } from 'react';
import CategoryBar from './CategoryBar';
import MenuSection from './MenuSection';

const DEFAULT_CATEGORY = 'Boshqa';
const ALL_CATEGORY = 'Barchasi';

const normalizeItemCategory = (item, fallbackCategory) =>
  String(item.category || fallbackCategory || DEFAULT_CATEGORY).trim() || DEFAULT_CATEGORY;

export default function MenuList({
  items,
  onAddToCart,
  activeCategory,
  onActiveCategoryChange,
}) {
  const sectionRefs = useRef({});

  const groupedMenu = useMemo(() => {
    if (!items?.length) return [];

    const fallbackCategory = items[0]?.restaurantCategory || '';
    const groups = items.reduce((accumulator, item) => {
      const category = normalizeItemCategory(item, fallbackCategory);
      if (!accumulator[category]) accumulator[category] = [];
      accumulator[category].push({ ...item, category });
      return accumulator;
    }, {});

    return Object.entries(groups).map(([title, groupedItems]) => ({
      title,
      items: groupedItems,
    }));
  }, [items]);

  const categories = useMemo(
    () => [ALL_CATEGORY, ...groupedMenu.map((group) => group.title)],
    [groupedMenu]
  );

  const filteredGroups = useMemo(() => {
    if (activeCategory === ALL_CATEGORY) return groupedMenu;
    return groupedMenu.filter((group) => group.title === activeCategory);
  }, [activeCategory, groupedMenu]);

  useEffect(() => {
    if (!groupedMenu.length) return undefined;

    const sections = groupedMenu
      .map((group) => ({ title: group.title, element: sectionRefs.current[group.title] }))
      .filter((section) => section.element);

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          onActiveCategoryChange(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-22% 0px -58% 0px',
        threshold: [0.2, 0.35, 0.5],
      }
    );

    sections.forEach((section) => observer.observe(section.element));
    return () => observer.disconnect();
  }, [groupedMenu, onActiveCategoryChange]);

  const handleSelectCategory = (category) => {
    onActiveCategoryChange(category);
    if (category === ALL_CATEGORY) {
      sectionRefs.current[groupedMenu[0]?.title]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    sectionRefs.current[category]?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  if (!items?.length) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold text-white">
        <span className="h-1 w-8 rounded-full bg-[#ffcc33]" />
        Menyu
      </h2>

      <CategoryBar categories={categories} activeCategory={activeCategory} onSelectCategory={handleSelectCategory} />

      <div className="space-y-8">
        {filteredGroups.map((group) => (
          <MenuSection
            key={group.title}
            title={group.title}
            items={group.items}
            sectionRef={(element) => {
              sectionRefs.current[group.title] = element;
            }}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
