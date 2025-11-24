import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import DynamicTable from './components/BOMTable';
import HistorySidebar from './components/HistorySidebar';
import { ExtractedItem, ProcessingState, HistoryItem, DocumentType, DocConfig } from './types';
import { transcribeDocument, FileInput } from './services/geminiService';

// Default Configuration
const DEFAULT_CONFIGS: Record<DocumentType, DocConfig> = {
  BOM: {
    type: 'BOM',
    label: 'Bill of Materials',
    prompt: `You are an expert industrial transcriptionist. Analyze this handwritten Bill of Materials.
    Extract: 'Part #' (partNumber), 'Description' (description), 'Qty' (quantity), 'Unit' (unit), 'Notes' (notes).
    If handwriting is messy, use engineering context. Return empty string for missing fields.`,
    columns: [
      { key: 'partNumber', label: 'Part #', minWidth: 120 },
      { key: 'description', label: 'Description', minWidth: 250 },
      { key: 'quantity', label: 'Qty', minWidth: 70 },
      { key: 'unit', label: 'Unit', minWidth: 70 },
      { key: 'notes', label: 'Notes', minWidth: 200 },
    ]
  },
  INVOICE: {
    type: 'INVOICE',
    label: 'Invoice',
    // Use backticks (`) for the prompt to allow multi-line text and internal quotes
    prompt: `Analyze this invoice. Extract Vendor Name and line items into a table. 
    Fields: 'Vendor' (Vendor), 'Item Code' (itemCode), 'Description' (description), 'Quantity' (quantity), 'Unit Price' (unitPrice), 'Total' (total).
    Ensure numeric values are formatted cleanly.`,
    columns: [
      { key: 'Vendor', label: 'Vendor', minWidth: 120 },
      { key: 'itemCode', label: 'Item Code', minWidth: 120 },
      { key: 'description', label: 'Description', minWidth: 250 },
      { key: 'quantity', label: 'Qty', minWidth: 80 },
      { key: 'unitPrice', label: 'Unit Price', minWidth: 100 },
      { key: 'total', label: 'Total', minWidth: 100 },
    ]
  },
  PO: {
    type: 'PO',
    label: 'Purchase Order',
    prompt: `Analyze this Purchase Order. Extract items.
    Fields: 'SKU' (sku), 'Description' (description), 'Quantity' (quantity), 'Unit Cost' (unitCost), 'Line Total' (lineTotal).`,
    columns: [
      { key: 'sku', label: 'SKU', minWidth: 120 },
      { key: 'description', label: 'Description', minWidth: 250 },
      { key: 'quantity', label: 'Qty', minWidth: 80 },
      { key: 'unitCost', label: 'Unit Cost', minWidth: 100 },
      { key: 'lineTotal', label: 'Total', minWidth: 100 },
    ]
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Document',
    prompt: `Analyze this document and extract tabular data. 
    Map columns to generic fields: col1, col2, col3, col4, notes.
    Try to map the most important identifier to col1 and description to col2.`,
    columns: [
      { key: 'col1', label: 'Column 1', minWidth: 120 },
      { key: 'col2', label: 'Column 2', minWidth: 150 },
      { key: 'col3', label: 'Column 3', minWidth: 120 },
      { key: 'col4', label: 'Column 4', minWidth: 120 },
      { key: 'notes', label: 'Notes', minWidth: 200 },
    ]
  }
};

const App: React.FC = () => {
  // State
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [currentDocType, setCurrentDocType] = useState<DocumentType>('BOM');
  
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({ status: 'idle' });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // History State (persisted)
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('bom_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bom_history', JSON.stringify(history));
  }, [history]);

  // Sync edits to history
  useEffect(() => {
    if (activeHistoryId && processingState.status === 'complete') {
      setHistory(prev => prev.map(h => 
        h.id === activeHistoryId ? { ...h, items: extractedItems } : h
      ));
    }
  }, [extractedItems, activeHistoryId, processingState.status]);

  // Processing Logic
  const handleFileSelect = useCallback(async (selectedFiles: File[], docType: DocumentType) => {
    setActiveHistoryId(null);
    setFiles(selectedFiles);
    setCurrentDocType(docType);
    setProcessingState({ status: 'uploading' });

    // Read all files
    const filePromises = selectedFiles.map(file => {
      return new Promise<{base64: string, mimeType: string, preview: string}>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          resolve({
            base64,
            mimeType: file.type,
            preview: result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const loadedFiles = await Promise.all(filePromises);
    setFilePreviews(loadedFiles.map(f => f.preview));
    
    setProcessingState({ status: 'processing', message: `Analyzing ${selectedFiles.length} ${docType} page(s)...` });
    
    try {
      // Use DEFAULT_CONFIGS directly
      const prompt = DEFAULT_CONFIGS[docType].prompt;
      // Map to format expected by service
      const filesForService: FileInput[] = loadedFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType }));
      
      const items = await transcribeDocument(filesForService, docType, prompt);
      
      setExtractedItems(items);
      setProcessingState({ status: 'complete' });

      // Save to History
      const fileNameLabel = selectedFiles.length === 1 
        ? selectedFiles[0].name 
        : `${selectedFiles[0].name} +${selectedFiles.length - 1}`;

      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        fileName: fileNameLabel,
        docType: docType,
        items: items
      };
      setHistory(prev => [newItem, ...prev]);
      setActiveHistoryId(newItem.id);

    } catch (error: any) {
      setProcessingState({ 
        status: 'error', 
        message: error.message || 'Unknown error occurred' 
      });
    }
  }, []);

  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setExtractedItems(item.items);
    setFiles([]);
    setFilePreviews([]);
    setCurrentDocType(item.docType || 'BOM'); // Backwards compatibility
    setActiveHistoryId(item.id);
    setProcessingState({ status: 'complete' });
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    if (activeHistoryId === id) {
      handleNewUpload();
    }
  }, [activeHistoryId]);

  const handleNewUpload = useCallback(() => {
    setFiles([]);
    setFilePreviews([]);
    setExtractedItems([]);
    setProcessingState({ status: 'idle' });
    setActiveHistoryId(null);
  }, []);

  const handleUpdateItem = useCallback((id: string, field: string, value: string) => {
    setExtractedItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setExtractedItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleExport = () => {
    if (extractedItems.length === 0) return;

    // Use DEFAULT_CONFIGS directly
    const columns = DEFAULT_CONFIGS[currentDocType].columns;
    const headerRow = columns.map(c => c.label).join(',');
    const rows = extractedItems.map(item => 
      columns.map(col => `"${(item[col.key] || '').replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentDocType}_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header />
      
      <div className="flex flex-1 overflow-hidden h-full">
        <HistorySidebar 
          history={history}
          onSelect={handleHistorySelect}
          onDelete={handleDeleteHistory}
          onNew={handleNewUpload}
          selectedId={activeHistoryId}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />

        <main className="flex-1 bg-slate-100 p-4 sm:p-6 lg:p-8 overflow-hidden flex flex-col gap-6 relative">
          
          {processingState.status === 'idle' && (
             <div className="max-w-2xl mx-auto w-full mt-10 h-full flex flex-col justify-center pb-20">
               <div className="text-center mb-8">
                 <h2 className="text-3xl font-light text-slate-800 mb-2">Digitize Documents</h2>
                 <p className="text-slate-500">Select a document type and upload to convert to Excel.</p>
               </div>
               <div className="h-64">
                 <UploadArea onFileSelect={handleFileSelect} isProcessing={false} />
               </div>
             </div>
          )}

          {processingState.status !== 'idle' && (
            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
              {/* Preview Panel */}
              <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden shrink-0 h-[300px] lg:h-auto">
                <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                   <h2 className="font-semibold text-slate-800 text-sm">Original {DEFAULT_CONFIGS[currentDocType].label}</h2>
                   <div className="flex gap-3 items-center">
                     {filePreviews.length > 1 && (
                       <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                         {filePreviews.length} pages
                       </span>
                     )}
                     <button onClick={handleNewUpload} className="text-xs text-brand-600 hover:underline">New Upload</button>
                   </div>
                </div>
                <div className="flex-1 overflow-auto bg-slate-800 flex flex-col items-center p-4 relative gap-4">
                   {filePreviews.length > 0 ? (
                     filePreviews.map((preview, index) => (
                       <div key={index} className="relative w-full shadow-lg">
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded">
                            Page {index + 1}
                          </div>
                          {files[index]?.type === 'application/pdf' ? (
                             <div className="bg-white h-64 flex items-center justify-center rounded">
                               <p className="text-sm text-slate-600">PDF Document</p>
                             </div>
                           ) : (
                             <img src={preview} alt={`Doc Preview ${index + 1}`} className="w-full h-auto object-contain bg-white rounded" />
                           )}
                       </div>
                     ))
                   ) : (
                      <div className="text-slate-400 text-center p-4 my-auto">
                        <p className="text-sm font-medium">Image not available</p>
                      </div>
                   )}
                   {processingState.status === 'processing' && (
                     <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                        <p className="font-medium">{processingState.message}</p>
                     </div>
                   )}
                </div>
              </div>

              {/* Data Panel */}
              <div className="w-full lg:w-2/3 flex flex-col h-full overflow-hidden">
                {processingState.status === 'error' ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-800">
                    <h3 className="font-bold text-lg">Extraction Failed</h3>
                    <p className="mb-4 text-sm opacity-80">{processingState.message}</p>
                    <button onClick={handleNewUpload} className="px-4 py-2 bg-white border border-red-300 rounded text-red-600 font-medium hover:bg-red-50">Try Again</button>
                  </div>
                ) : (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                       <div className="flex items-center gap-2">
                         <span className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                           {DEFAULT_CONFIGS[currentDocType].label}
                         </span>
                       </div>
                       <button 
                         onClick={handleExport}
                         disabled={extractedItems.length === 0}
                         className={`
                           flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all shadow-sm
                           ${extractedItems.length > 0 
                             ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                             : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
                         `}
                       >
                         Download Excel (CSV)
                       </button>
                    </div>
                    
                    <div className="flex-1 overflow-hidden relative">
                      {extractedItems.length > 0 ? (
                        <DynamicTable 
                          items={extractedItems} 
                          columns={DEFAULT_CONFIGS[currentDocType].columns}
                          onUpdateItem={handleUpdateItem}
                          onDeleteItem={handleDeleteItem}
                        />
                      ) : processingState.status === 'processing' ? (
                         <div className="h-full flex flex-col gap-4 p-4 animate-pulse">
                           {[1,2,3,4,5].map(i => (
                             <div key={i} className="h-12 bg-slate-200 rounded-md w-full"></div>
                           ))}
                         </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default App;