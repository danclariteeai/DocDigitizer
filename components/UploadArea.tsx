import React, { useCallback, useState } from 'react';
import { DocumentType } from '../types';

interface UploadAreaProps {
  onFileSelect: (files: File[], docType: DocumentType) => void;
  isProcessing: boolean;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('BOM');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndPass(e.dataTransfer.files);
    }
  }, [selectedType]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndPass(e.target.files);
    }
  };

  const validateAndPass = (fileList: FileList) => {
    const files = Array.from(fileList);
    
    if (files.length > 3) {
      alert("You can only upload up to 3 documents at a time.");
      return;
    }

    const validFiles = files.filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
    if (validFiles.length !== files.length) {
      alert("Only images (JPG, PNG) and PDF files are allowed.");
      return;
    }
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles, selectedType);
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Document Type Selector */}
      <div className="flex justify-center mb-2">
        <div className="inline-flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          {(['BOM', 'INVOICE', 'PO', 'OTHER'] as DocumentType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all
                ${selectedType === type 
                  ? 'bg-brand-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-brand-600'}
              `}
              disabled={isProcessing}
            >
              {type === 'BOM' ? 'Bill of Materials' : 
               type === 'INVOICE' ? 'Invoice' : 
               type === 'PO' ? 'Purchase Order' : 'Other'}
            </button>
          ))}
        </div>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer transition-all duration-300 ease-in-out
          border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center
          flex-1
          ${isDragging 
            ? 'border-brand-500 bg-brand-50' 
            : 'border-slate-300 bg-slate-50 hover:border-brand-400 hover:bg-white'}
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input 
          type="file" 
          multiple
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          accept="image/*,application/pdf"
          disabled={isProcessing}
        />
        
        <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-brand-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Upload {selectedType}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs mb-2">
          Drag & drop or click to upload.
        </p>
        <p className="text-xs text-brand-500 font-medium">
          Up to 3 pages supported
        </p>
      </div>
    </div>
  );
};

export default UploadArea;