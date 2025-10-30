import React, { useState, useMemo } from 'react';
import { FormFillerHistoryItem, WriterHistoryItem, ImageHistoryItem, VideoHistoryItem, DocumentDesignerHistoryItem, ImageCaptionerHistoryItem } from '../types';
import { CopyIcon, CheckIcon, TrashIcon, MagnifyingGlassIcon, ArrowPathIcon, XMarkIcon, PhotoIcon, VideoCameraIcon } from '../constants';
import IconButton from './IconButton';

type HistoryItem = FormFillerHistoryItem | WriterHistoryItem | ImageHistoryItem | VideoHistoryItem | DocumentDesignerHistoryItem | ImageCaptionerHistoryItem;

interface HistoryProps {
  mode: 'writer' | 'formFiller' | 'imageGenerator' | 'videoGenerator' | 'documentDesigner' | 'imageCaptioner';
  history: HistoryItem[];
  onClose: () => void;
  onDelete: (id: number) => void;
  onClearAll: () => void;
  onReuseInfo: (item: HistoryItem) => void;
  onCopy: (text: string) => void;
}

const History: React.FC<HistoryProps> = ({ mode, history, onClose, onDelete, onClearAll, onReuseInfo, onCopy }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const filteredHistory = useMemo(() => {
    const trimmedSearch = searchTerm.trim().toLowerCase();
    if (!trimmedSearch) {
      return history;
    }
    return history.filter(item => {
      if (mode === 'writer') {
        const writerItem = item as WriterHistoryItem;
        return (
          writerItem.prompt.toLowerCase().includes(trimmedSearch) ||
          writerItem.result.toLowerCase().includes(trimmedSearch)
        );
      } else if (mode === 'formFiller') {
        const formFillerItem = item as FormFillerHistoryItem;
        return (
          formFillerItem.infoText.toLowerCase().includes(trimmedSearch) ||
          formFillerItem.result.some(field => field.value.toLowerCase().includes(trimmedSearch))
        );
      } else if (mode === 'imageGenerator' || mode === 'videoGenerator') {
        const mediaItem = item as ImageHistoryItem | VideoHistoryItem;
        return mediaItem.prompt.toLowerCase().includes(trimmedSearch);
      } else if (mode === 'documentDesigner') {
        const docItem = item as DocumentDesignerHistoryItem;
        return (
          docItem.prompt.toLowerCase().includes(trimmedSearch) ||
          docItem.result.toLowerCase().includes(trimmedSearch)
        );
      } else if (mode === 'imageCaptioner') {
        const captionerItem = item as ImageCaptionerHistoryItem;
        return captionerItem.caption.toLowerCase().includes(trimmedSearch);
      }
      return false;
    });
  }, [history, searchTerm, mode]);
  
  const handleCopy = (item: HistoryItem) => {
    let textToCopy = '';
    if (mode === 'writer') {
        textToCopy = (item as WriterHistoryItem).result;
    } else if (mode === 'formFiller') {
        textToCopy = JSON.stringify((item as FormFillerHistoryItem).result, null, 2);
    } else if (mode === 'imageGenerator' || mode === 'videoGenerator') {
        textToCopy = (item as ImageHistoryItem | VideoHistoryItem).prompt;
    } else if (mode === 'documentDesigner') {
        textToCopy = (item as DocumentDesignerHistoryItem).result;
    } else if (mode === 'imageCaptioner') {
        textToCopy = (item as ImageCaptionerHistoryItem).caption;
    }
    
    onCopy(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderWriterItem = (item: WriterHistoryItem) => (
    <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
      <div className="flex-grow">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">
          <span className="font-semibold">คำสั่ง:</span> {item.prompt}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
          {item.result}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
          <div className="flex items-center gap-1">
            <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอกผลลัพธ์" className="hover:text-indigo-500">
               {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
            </IconButton>
             <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
              <ArrowPathIcon className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFormFillerItem = (item: FormFillerHistoryItem) => (
     <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex gap-4 items-start">
        <img src={item.image} alt="document thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
        <div className="flex-grow">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">
            <span className="font-semibold">ข้อมูลที่ใช้:</span> {item.infoText}
          </p>
          <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
            {item.result.map(r => `${r.field}: ${r.value}`).join(' | ')}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอก JSON" className="hover:text-indigo-500">
                  {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
              </IconButton>
              <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
                <ArrowPathIcon className="w-4 h-4" />
              </IconButton>
              <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
  );
  
  const renderImageGeneratorItem = (item: ImageHistoryItem) => (
     <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex gap-4 items-start">
        <img src={item.dataUrl} alt="generated image thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
        <div className="flex-grow">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 line-clamp-3">
            {item.prompt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอก Prompt" className="hover:text-indigo-500">
                  {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
              </IconButton>
              <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
                <ArrowPathIcon className="w-4 h-4" />
              </IconButton>
              <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
  );
  
  const renderVideoGeneratorItem = (item: VideoHistoryItem) => (
     <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex gap-4 items-start">
        {item.imageUrl ? (
             <img src={item.imageUrl} alt="input image thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
        ) : (
            <div className="w-16 h-16 rounded-md flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <VideoCameraIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
        )}
        <div className="flex-grow">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 line-clamp-3">
            {item.prompt}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
            <div className="flex items-center gap-1">
              <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอก Prompt" className="hover:text-indigo-500">
                  {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
              </IconButton>
              <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
                <ArrowPathIcon className="w-4 h-4" />
              </IconButton>
              <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
  );

  const renderDocumentDesignerItem = (item: DocumentDesignerHistoryItem) => (
    <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg">
      <div className="flex-grow">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span className="font-semibold">ประเภท:</span> {item.documentType}
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-2">
          {item.result}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
          <div className="flex items-center gap-1">
            <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอกเอกสาร" className="hover:text-indigo-500">
               {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
            </IconButton>
             <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
              <ArrowPathIcon className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
              <TrashIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderImageCaptionerItem = (item: ImageCaptionerHistoryItem) => (
    <div key={item.id} className="p-3 bg-white/50 dark:bg-black/20 rounded-lg flex gap-4 items-start">
        <img src={item.image} alt="captioned image thumbnail" className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
        <div className="flex-grow">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 line-clamp-3">
            {item.caption}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
            <span>{new Date(item.timestamp).toLocaleString('th-TH')}</span>
            <div className="flex items-center gap-1">
            <IconButton onClick={() => handleCopy(item)} aria-label="คัดลอกคำบรรยาย" className="hover:text-indigo-500">
                {copiedId === item.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
            </IconButton>
            <IconButton onClick={() => onReuseInfo(item)} aria-label="ใช้ข้อมูลนี้" className="hover:text-sky-500">
                <ArrowPathIcon className="w-4 h-4" />
            </IconButton>
            <IconButton onClick={() => onDelete(item.id)} aria-label="ลบ" className="hover:text-red-500">
                <TrashIcon className="w-4 h-4" />
            </IconButton>
            </div>
        </div>
        </div>
    </div>
  );

  const getTitle = () => {
    switch (mode) {
      case 'writer': return 'ผู้ช่วยเขียน';
      case 'formFiller': return 'ผู้ช่วยกรอกเอกสาร';
      case 'imageGenerator': return 'ผู้สร้างภาพ';
      case 'videoGenerator': return 'ผู้สร้างวิดีโอ';
      case 'documentDesigner': return 'ผู้สร้างเอกสาร';
      case 'imageCaptioner': return 'ผู้สร้างคำบรรยายภาพ';
      default: return 'ประวัติ';
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
        <div 
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              ประวัติ - {getTitle()}
            </h3>
            <IconButton onClick={onClose} aria-label="ปิด" className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
              <XMarkIcon className="w-6 h-6" />
            </IconButton>
          </div>

          <div className="relative mb-4 flex-shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาในประวัติ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 rounded-lg shadow-sm transition-all duration-300 bg-gray-100 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-indigo-400/0 focus:bg-gray-200/50 dark:focus:bg-gray-900"
            />
            {searchTerm && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <IconButton onClick={() => setSearchTerm('')} aria-label="ล้างการค้นหา" className="p-1 text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
                        <XMarkIcon className="w-4 h-4" />
                    </IconButton>
                </div>
            )}
          </div>

          <div className="overflow-y-auto pr-2 space-y-3 flex-grow">
            {filteredHistory.length > 0 ? (
              filteredHistory.map(item => {
                  if (mode === 'writer') return renderWriterItem(item as WriterHistoryItem);
                  if (mode === 'formFiller') return renderFormFillerItem(item as FormFillerHistoryItem);
                  if (mode === 'imageGenerator') return renderImageGeneratorItem(item as ImageHistoryItem);
                  if (mode === 'videoGenerator') return renderVideoGeneratorItem(item as VideoHistoryItem);
                  if (mode === 'documentDesigner') return renderDocumentDesignerItem(item as DocumentDesignerHistoryItem);
                  if (mode === 'imageCaptioner') return renderImageCaptionerItem(item as ImageCaptionerHistoryItem);
                  return null;
              })
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                {searchTerm ? 'ไม่พบผลลัพธ์ที่ตรงกัน' : 'ยังไม่มีประวัติ'}
              </p>
            )}
          </div>

          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300/50 dark:border-gray-700/50 flex-shrink-0">
              <button
                onClick={onClearAll}
                className="w-full flex items-center justify-center gap-2 bg-red-500/80 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span>ล้างประวัติทั้งหมด</span>
              </button>
            </div>
          )}
        </div>
    </div>
  );
};

export default History;