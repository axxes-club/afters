import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  overscanCount?: number;
  className?: string;
}

function VirtualizedList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
  overscanCount = 5,
  className = '',
}: VirtualizedListProps<T>) {
  const itemCount = items.length;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  );

  if (itemCount === 0) {
    return <div className="text-center py-8 text-gray-500">No items found</div>;
  }

  return (
    <List
      height={containerHeight}
      itemCount={itemCount}
      itemSize={itemHeight}
      overscanCount={overscanCount}
      className={className}
    >
      {Row}
    </List>
  );
}

export default VirtualizedList;