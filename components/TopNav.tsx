'use client';

import { Activity, TrendingUp, Upload, Settings, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';

interface TopNavProps {
  currentTab: 'dashboard' | 'forecast' | 'upload' | 'settings';
  onTabChange: (tab: 'dashboard' | 'forecast' | 'upload' | 'settings') => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  uploadStatus: string;
}

export default function TopNav({ currentTab, onTabChange, onFileUpload, uploading, uploadStatus }: TopNavProps) {
  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Navaroo</h1>
              <p className="text-xs text-slate-500 -mt-0.5">Financial Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => onTabChange('forecast')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'forecast'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Forecast
            </button>
            <label className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
              currentTab === 'upload'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}>
              <Upload className="w-4 h-4" />
              Upload
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onFileUpload}
                className="hidden"
                disabled={uploading}
                multiple
              />
            </label>
            <button
              onClick={() => onTabChange('settings')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold transition-all ${
                currentTab === 'settings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Upload Status */}
          {uploadStatus && (
            <div className={`text-sm font-medium px-4 py-2 rounded-lg ${
              uploadStatus.includes('✓') ? 'bg-green-50 text-green-700' : 
              uploadStatus.includes('✗') ? 'bg-red-50 text-red-700' : 
              'bg-yellow-50 text-yellow-700'
            }`}>
              {uploadStatus}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
