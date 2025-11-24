import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ExtractedItem, ColumnDefinition } from '../types';

interface DynamicTableProps {
  items: ExtractedItem[];
  columns: ColumnDefinition[];
  onUpdateItem: (id: string, field: string, value: string) => void;
  onDeleteItem: (id: string) => void;
}

const DynamicTable: React.FC<DynamicTableProps> = ({ items, columns, onUpdateItem, onDeleteItem }) => {
  // State for column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  // Initialize widths when columns change
  useEffect(() => {
    const initialWidths: Record<string, number> = {};
    columns.forEach(col => {
      initialWidths[col.key] = col.minWidth;
    });
    // Add action column
    initialWidths['action'] = 70;
    setColumnWidths(initialWidths);
  }, [columns]);

  const resizingRef = useRef<{ startX: number; startWidth: number; columnKey: string } | null>(null);

  const startResize = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizingRef.current = {
      startX: e.pageX,
      startWidth: columnWidths[columnKey],
      columnKey
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingRef.current) return;
    
    const { startX, startWidth, columnKey } = resizingRef.current;
    const delta = e.pageX - startX;
    
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: Math.max(50, startWidth + delta)
    }));
  }, []);

  const handleMouseUp = useCallback(() => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove]);

  if (items.length === 0) return null;

  // Fix: Cast Object.values to number[] to ensure type safety in reduce
  const totalWidth = (Object.values(columnWidths) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
        <h2 className="font-semibold text-slate-800">Extracted Data ({items.length} items)</h2>
        <span className="text-xs text-slate-500 italic">Drag dividers to resize</span>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        <table 
          className="table-fixed min-w-full divide-y divide-slate-200" 
          style={{ width: Math.max(totalWidth, 100) + 'px' }}
        >
          <colgroup>
            <col style={{ width: 40 }} /> {/* Index */}
            {columns.map(col => (
               <col key={col.key} style={{ width: columnWidths[col.key] || col.minWidth }} />
             ))}
             <col style={{ width: columnWidths['action'] || 70 }} />
          </colgroup>
          
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b">
                #
              </th>
              {columns.map((col) => (
                <th 
                  key={col.key}
                  className="relative px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider group bg-slate-50 border-b"
                >
                  <div className="flex items-center justify-between h-full truncate">
                    {col.label}
                  </div>
                  
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex justify-center items-center group-hover:bg-slate-200/50 hover:bg-brand-500/20 transition-colors z-20"
                    onMouseDown={(e) => startResize(e, col.key)}
                    style={{ transform: 'translateX(50%)' }}
                  >
                    <div className="w-0.5 h-4 bg-slate-300 group-hover:bg-brand-400 rounded"></div>
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-50 border-b">
                Action
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-slate-200">
            {items.map((item, index) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-slate-400 truncate">
                  {index + 1}
                </td>
                {columns.map(col => (
                  <td key={col.key} className="px-1 py-1">
                    <input 
                      type="text" 
                      value={item[col.key] || ''}
                      onChange={(e) => onUpdateItem(item.id, col.key, e.target.value)}
                      className="w-full border-0 bg-transparent p-2 text-sm focus:ring-1 focus:ring-brand-500 rounded text-slate-800 truncate focus:text-clip"
                    />
                  </td>
                ))}
                <td className="px-3 py-2 text-right whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTable;