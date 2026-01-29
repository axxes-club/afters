import React from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number;
  overscanCount?: number;
  className?: string;
}

function VirtualizedTable<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
  overscanCount = 5,
  className = '',
}: VirtualizedTableProps<T>) {
  const itemCount = items.length;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <tr style={style}>
      {renderItem(items[index], index)}
    </tr>
  );

  if (itemCount === 0) {
    return <tr><td colSpan={100} className="p-8 text-center text-muted-foreground">No items found</td></tr>;
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

export default VirtualizedTable;