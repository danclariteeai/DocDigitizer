import React, { useState } from 'react';
import { DocConfig, DocumentType } from '../types';

interface AdminSettingsProps {
  configs: Record<DocumentType, DocConfig>;
  onSave: (configs: Record<DocumentType, DocConfig>) => void;
  onClose: () => void;
  onReset: () => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ configs, onSave, onClose, onReset }) => {
  const [activeTab, setActiveTab] = useState<DocumentType>('BOM');
  const [localConfigs, setLocalConfigs] = useState(configs);

  const handlePromptChange = (val: string) => {
    setLocalConfigs(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        prompt: val
      }
    }));
  };

  const handleSave = () => {
    onSave(localConfigs);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Admin Configuration</h2>
            <p className="text-sm text-slate-500">Manage AI system instructions for document types</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col sm:flex-row">
          {/* Sidebar Tabs */}
          <div className="w-full sm:w-48 bg-slate-50 border-r border-slate-200 p-2 flex flex-row sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
            {(Object.keys(localConfigs) as DocumentType[]).map(type => (
              <button
                key={type}
                onClick={() => setActiveTab(type)}
                className={`
                  px-4 py-3 text-left text-sm font-medium rounded-lg whitespace-nowrap
                  ${activeTab === type 
                    ? 'bg-white text-brand-600 shadow-sm ring-1 ring-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100'}
                `}
              >
                {localConfigs[type].label}
              </button>
            ))}
          </div>

          {/* Editor Area */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto">
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                System Instruction / Prompt
              </label>
              <p className="text-xs text-slate-500 mb-3">
                This prompt is sent to the Gemini AI model. Describe exactly what fields to extract and how to handle messy handwriting.
              </p>
              <textarea
                value={localConfigs[activeTab].prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                className="w-full h-64 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-mono text-sm leading-relaxed"
                spellCheck={false}
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
              <strong>Note:</strong> The output schema is fixed for this type to ensure Excel compatibility. Changing the prompt only affects extraction logic, not the columns.
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center rounded-b-xl">
          <button 
            onClick={() => {
              if(confirm("Are you sure you want to reset all prompts to default?")) onReset();
            }}
            className="text-red-600 text-sm hover:underline font-medium"
          >
            Reset Defaults
          </button>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
