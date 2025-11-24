import React from 'react';
import { HistoryItem } from '../types';

interface HistorySidebarProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  selectedId: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ 
  history, 
  onSelect, 
  onDelete, 
  onNew, 
  selectedId,
  isOpen,
  setIsOpen
}) => {
  if (!isOpen) {
    return (
       <div className="bg-white border-r border-slate-200 w-14 flex flex-col items-center py-4 gap-4 shrink-0 transition-all duration-300 z-20">
          <button 
            onClick={() => setIsOpen(true)}
            className="p-3 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition-colors"
            title="Open History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="w-8 h-px bg-slate-200"></div>
          <button 
            onClick={onNew}
            className="p-3 bg-brand-50 hover:bg-brand-100 rounded-lg text-brand-600 transition-colors"
            title="New Upload"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
       </div>
    );
  }

  return (
    <div className="bg-white border-r border-slate-200 w-72 md:w-80 flex flex-col h-full shrink-0 transition-all duration-300 shadow-xl z-20 relative">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-brand-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </h2>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="p-4">
        <button 
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-lg hover:bg-brand-700 transition-all shadow-sm hover:shadow active:scale-[0.98]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Upload
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 pt-0">
        {history.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
             </div>
            <p className="text-slate-500 text-sm font-medium">No history yet</p>
            <p className="text-slate-400 text-xs mt-1">Upload a document to start</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(item => (
              <div 
                key={item.id}
                className={`
                  group relative p-3 rounded-lg border cursor-pointer transition-all select-none
                  ${selectedId === item.id 
                    ? 'bg-brand-50 border-brand-200 shadow-sm ring-1 ring-brand-200' 
                    : 'bg-white border-slate-100 hover:border-brand-200 hover:shadow-sm'}
                `}
                onClick={() => onSelect(item)}
              >
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <span className="font-medium text-slate-700 truncate text-sm flex-1" title={item.fileName}>
                    {item.fileName}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                    title="Delete from history"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs text-slate-400 font-mono">
                     {new Date(item.timestamp).toLocaleDateString()}
                   </span>
                   <span className="text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                     {item.items.length} Rows
                   </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;