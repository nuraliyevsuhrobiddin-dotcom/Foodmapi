import CategoryList from './CategoryList';

export default function FilterPanel({
  categoryOptions,
  selectedCategory,
  onSelectCategory,
  sortBy,
  setSortBy,
  triggerGPS,
}) {
  return (
    <CategoryList
      categoryOptions={categoryOptions}
      selectedCategory={selectedCategory}
      onSelectCategory={onSelectCategory}
      sortBy={sortBy}
      setSortBy={setSortBy}
      triggerGPS={triggerGPS}
    />
  );
}
