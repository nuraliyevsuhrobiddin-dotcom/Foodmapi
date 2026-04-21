import CategoryList from './CategoryList';

export default function FilterPanel({
  sortBy,
  setSortBy,
  triggerGPS,
}) {
  return (
    <CategoryList
      sortBy={sortBy}
      setSortBy={setSortBy}
      triggerGPS={triggerGPS}
    />
  );
}
