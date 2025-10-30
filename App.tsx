import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FormField, FormFillerHistoryItem, Tone, Personality, WriterHistoryItem, OutputLength, AspectRatio, ImageHistoryItem, ArtStyle, ChatMessage, VideoHistoryItem, DocumentType, DocumentDesignerHistoryItem, ImageCaptionerHistoryItem } from './types';
import { analyzeAndFillForm, generateText, generateImages, generatePromptSuggestions, generateVideo, chatService, generateImageCaption, generateDocument, generateVideoPromptSuggestion } from './services/geminiService';
import { calculateFleschKincaid } from './utils/readability';
import { requestNotificationPermission, showNotification } from './utils/notifications';
import Loader from './components/Loader';
import IconButton from './components/IconButton';
import History from './components/History';
import ExampleGallery from './components/ExampleGallery';
import Selector from './components/Selector';
import {
  SparklesIcon, SunIcon, MoonIcon, TrashIcon, CopyIcon, CheckIcon, HistoryIcon, PhotoIcon, VideoCameraIcon,
  XMarkIcon, ArrowDownTrayIcon, LightBulbIcon, MagicWandIcon, SpeakerWaveIcon, SpeakerXMarkIcon, Cog6ToothIcon, PaperAirplaneIcon,
  DocumentTextIcon, InformationCircleIcon,
} from './constants';

type AppMode = 'writer' | 'aiChat' | 'documentDesigner' | 'imageCaptioner' | 'formFiller' | 'imageGenerator' | 'videoGenerator';

// Utility to convert File to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};


const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('writer');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => 
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  
  const modeSwitcherRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (modeSwitcherRef.current && indicatorRef.current) {
        const activeButton = modeSwitcherRef.current.querySelector(`button[data-mode="${mode}"]`) as HTMLElement;
        if (activeButton) {
            const containerLeft = modeSwitcherRef.current.getBoundingClientRect().left;
            const buttonLeft = activeButton.getBoundingClientRect().left;
            indicatorRef.current.style.width = `${activeButton.offsetWidth}px`;
            indicatorRef.current.style.transform = `translateX(${buttonLeft - containerLeft}px)`;
        }
    }
  }, [mode]);

  const ModeSwitcher = () => (
    <div ref={modeSwitcherRef} className="bg-gray-200/50 dark:bg-gray-700/50 p-1 rounded-full flex items-center flex-wrap justify-center mode-switcher-container">
      <div ref={indicatorRef} className="mode-switcher-indicator" />
      <button data-mode="writer" onClick={() => setMode('writer')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'writer' ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้ช่วยเขียน
      </button>
      <button data-mode="aiChat" onClick={() => setMode('aiChat')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'aiChat' ? 'text-teal-500' : 'text-gray-600 dark:text-gray-300'}`}>
        AI แชท
      </button>
       <button data-mode="documentDesigner" onClick={() => setMode('documentDesigner')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'documentDesigner' ? 'text-orange-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้สร้างเอกสาร
      </button>
      <button data-mode="imageCaptioner" onClick={() => setMode('imageCaptioner')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'imageCaptioner' ? 'text-cyan-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้สร้างคำบรรยายภาพ
      </button>
      <button data-mode="formFiller" onClick={() => setMode('formFiller')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'formFiller' ? 'text-sky-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้ช่วยกรอกเอกสาร
      </button>
      <button data-mode="imageGenerator" onClick={() => setMode('imageGenerator')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'imageGenerator' ? 'text-purple-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้สร้างภาพ
      </button>
      <button data-mode="videoGenerator" onClick={() => setMode('videoGenerator')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${mode === 'videoGenerator' ? 'text-rose-500' : 'text-gray-600 dark:text-gray-300'}`}>
        ผู้สร้างวิดีโอ
      </button>
    </div>
  );

  const renderMode = () => {
    switch(mode) {
      case 'writer': return <AIWriter />;
      case 'formFiller': return <FormFiller />;
      case 'imageGenerator': return <ImageGenerator />;
      case 'videoGenerator': return <AIVideoGenerator />;
      case 'aiChat': return <AIChat />;
      case 'documentDesigner': return <AIDocumentDesigner />;
      case 'imageCaptioner': return <ImageCaptioner />;
      default: return <AIWriter />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 font-sans">
      <header className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-sky-500">
                ผู้ช่วย AI อัจฉริยะ
            </h1>
            <div className="hidden lg:block">
              <ModeSwitcher />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label={isDarkMode ? 'เปิดโหมดสว่าง' : 'เปิดโหมดมืด'}
                className="hover:bg-gray-200 dark:hover:bg-gray-700"
            >
                {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-indigo-500" />}
            </IconButton>
          </div>
        </div>
        <div className="lg:hidden p-2 border-t border-gray-200 dark:border-gray-700/50 flex justify-center">
          <ModeSwitcher />
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {renderMode()}
      </main>
    </div>
  );
};


// #region AI Writer Component
const AIWriter: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [tone, setTone] = useState<Tone>(Tone.Friendly);
    const [personality, setPersonality] = useState<Personality>(Personality.Assistant);
    const [outputLength, setOutputLength] = useState<OutputLength>(OutputLength.Medium);
    const [keywords, setKeywords] = useState<string>('');
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [showExamples, setShowExamples] = useState<boolean>(false);
    const [showSettings, setShowSettings] = useState<boolean>(true);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    const [history, setHistory] = useState<WriterHistoryItem[]>(() => {
        try {
            const localHistory = window.localStorage.getItem('gemini-writer-history');
            return localHistory ? JSON.parse(localHistory) : [];
        } catch (e) {
            console.error("Failed to parse writer history from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem('gemini-writer-history', JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save writer history to localStorage", e);
            }
        }, 500); // Debounce with 500ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [history]);
    
    const { score: readabilityScore, level: readabilityLevel } = calculateFleschKincaid(result);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('กรุณาป้อนข้อความเริ่มต้น');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');
        window.speechSynthesis.cancel(); // Stop any ongoing speech
        setIsSpeaking(false);

        try {
            const generatedText = await generateText(prompt, tone, personality, outputLength, keywords);
            setResult(generatedText);

            const newHistoryItem: WriterHistoryItem = {
                id: Date.now(),
                prompt,
                tone,
                personality,
                outputLength,
                keywords,
                result: generatedText,
                timestamp: new Date().toISOString(),
            };
            setHistory(prev => [newHistoryItem, ...prev]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleToggleSpeech = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        if (result) {
            const utterance = new SpeechSynthesisUtterance(result);
            utterance.lang = 'th-TH';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };
    
    const handleClear = () => {
        setPrompt('');
        setResult('');
        setError(null);
        setKeywords('');
        setOutputLength(OutputLength.Medium);
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    };
    
    const handleReuseWriterInfo = (item: WriterHistoryItem) => {
        setPrompt(item.prompt);
        setTone(item.tone);
        setPersonality(item.personality);
        setOutputLength(item.outputLength || OutputLength.Medium);
        setKeywords(item.keywords || '');
        setResult(item.result);
        setShowHistory(false);
    };

    const WriterSkeletonLoader = () => (
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full skeleton-line"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-11/12 skeleton-line"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full skeleton-line"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 skeleton-line"></div>
        </div>
    );

    return (
        <>
            {showHistory && <History mode="writer" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseWriterInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
            {showExamples && <ExampleGallery selectedTone={tone} selectedPersonality={personality} onUseExample={(p) => { setPrompt(p); setShowExamples(false); }} onClose={() => setShowExamples(false)} />}
        
            <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in-up">
                {/* Controls */}
                <div className="p-5 rounded-2xl bg-white dark:bg-gray-800 shadow-lg animate-subtle-glow overflow-hidden">
                    <div className="flex justify-between items-center">
                       <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผู้ช่วยเขียน AI</h2>
                       <div className="flex items-center gap-2">
                            <IconButton onClick={() => setShowSettings(!showSettings)} aria-label="การตั้งค่า" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Cog6ToothIcon className="w-6 h-6" />
                            </IconButton>
                             <IconButton onClick={() => setShowExamples(true)} aria-label="ดูตัวอย่าง" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                <LightBulbIcon className="w-6 h-6" />
                            </IconButton>
                            <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                <HistoryIcon className="w-6 h-6" />
                            </IconButton>
                       </div>
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out ${showSettings ? 'max-h-screen mt-4 pt-4 border-t border-gray-200 dark:border-gray-700' : 'max-h-0'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Selector id="personality-selector" label="เลือกบุคลิก" value={personality} options={Object.values(Personality)} onChange={(v) => setPersonality(v as Personality)} />
                            <Selector id="tone-selector" label="เลือกน้ำเสียง" value={tone} options={Object.values(Tone)} onChange={(v) => setTone(v as Tone)} />
                            <div className="md:col-span-2 flex flex-col gap-4 p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50">
                                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 -mb-2">การปรับแต่ง</h3>
                                <Selector id="output-length-selector" label="ความยาวผลลัพธ์" value={outputLength} options={Object.values(OutputLength)} onChange={(v) => setOutputLength(v as OutputLength)} />
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="keywords-input" className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                        คำสำคัญ (ถ้ามี)
                                    </label>
                                    <input
                                        id="keywords-input"
                                        type="text"
                                        value={keywords}
                                        onChange={(e) => setKeywords(e.target.value)}
                                        placeholder="เช่น นวัตกรรม, อนาคต"
                                        className="w-full px-3 py-2.5 text-base transition-all duration-300 rounded-lg shadow-sm bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-indigo-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt & Actions */}
                <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="ป้อนข้อความเริ่มต้นที่นี่..." rows={6} className="w-full p-3 text-base transition-all duration-300 rounded-lg shadow-sm resize-y bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-indigo-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40" disabled={isLoading} />
                    <div className="flex flex-col sm:flex-row gap-3">
                         <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                             {isLoading ? <Loader className="w-5 h-5" /> : <MagicWandIcon className="w-5 h-5" />}
                            <span>{isLoading ? 'กำลังสร้าง...' : 'สร้างข้อความ'}</span>
                         </button>
                         <IconButton onClick={handleClear} disabled={isLoading} aria-label="ล้าง" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /></IconButton>
                    </div>
                </div>
            
                {/* Result */}
                <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผลลัพธ์</h2>
                        <div className="flex items-center gap-1">
                            {result && <div className="text-sm text-gray-500 dark:text-gray-400 mr-2">ระดับการอ่าน: {readabilityLevel} ({readabilityScore})</div>}
                            <IconButton onClick={handleToggleSpeech} disabled={!result || isLoading} aria-label={isSpeaking ? "หยุดอ่าน" : "อ่านออกเสียง"} className="hover:bg-gray-200 dark:hover:bg-gray-700">
                                {isSpeaking ? <SpeakerXMarkIcon className="w-5 h-5 text-red-500" /> : <SpeakerWaveIcon className="w-5 h-5" />}
                            </IconButton>
                            <IconButton onClick={handleCopy} disabled={!result || isLoading} aria-label="คัดลอก" className="hover:bg-gray-200 dark:hover:bg-gray-700">{isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}</IconButton>
                        </div>
                    </div>
                    <div className="relative w-full min-h-[200px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 transition-all duration-300">
                        {isLoading && <WriterSkeletonLoader />}
                        {!isLoading && error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
                        {!isLoading && !error && !result && <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">ข้อความที่สร้างจะปรากฏที่นี่...</div>}
                        {!isLoading && result && <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-100">{result}</div>}
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion AI Writer Component


// #region Form Filler Component
const FormFiller: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [infoText, setInfoText] = useState<string>('');
  const [result, setResult] = useState<FormField[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingDocument, setIsGeneratingDocument] = useState<boolean>(false);


  const [history, setHistory] = useState<FormFillerHistoryItem[]>(() => {
    try {
      const localHistory = window.localStorage.getItem('gemini-form-filler-history');
      return localHistory ? JSON.parse(localHistory) : [];
    } catch (e) {
      console.error("Failed to parse form filler history from localStorage", e);
      return [];
    }
  });
  
  const dropzoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      try {
        window.localStorage.setItem('gemini-form-filler-history', JSON.stringify(history));
      } catch (e) {
        console.error("Failed to save form filler history to localStorage", e);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [history]);

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      fileToBase64(file).then(setImagePreview);
    } else if (file) {
      setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile || !infoText.trim()) {
      setError('กรุณาอัปโหลดรูปภาพและป้อนข้อมูลสำหรับกรอก');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult([]);
    
    try {
      const base64Data = (await fileToBase64(imageFile)).split(',')[1];
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: imageFile.type,
        },
      };

      const filledData = await analyzeAndFillForm(imagePart, infoText);
      setResult(filledData);
      
      const newHistoryItem: FormFillerHistoryItem = {
        id: Date.now(),
        infoText,
        image: imagePreview!,
        result: filledData,
        timestamp: new Date().toISOString(),
      };
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(errorMessage);
      setResult([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result.length) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleDownload = () => {
    if (!result.length || isLoading) return;
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `form-data-${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadFilledDocument = () => {
    if (!result.length || !imagePreview || isLoading || isGeneratingDocument) return;
    
    setIsGeneratingDocument(true);
    setError(null);

    const image = new Image();
    image.crossOrigin = 'anonymous'; 
    image.src = imagePreview;
  
    image.onload = async () => {
      try {
        await document.fonts.ready;

        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
    
        if (!ctx) {
          setError("ไม่สามารถสร้างเอกสารได้: ไม่สามารถเข้าถึง Canvas context");
          setIsGeneratingDocument(false);
          return;
        }
    
        ctx.drawImage(image, 0, 0);
    
        result.forEach(item => {
          const { value, coordinates } = item;
          if (!coordinates) return;
          
          const fontSize = Math.max(12, coordinates.height * 0.75); 
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
    
          const xPos = coordinates.x + 4;
          const yPos = coordinates.y + (coordinates.height / 2);
    
          ctx.fillText(value, xPos, yPos, coordinates.width - 8);
        });
    
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        link.download = `filled-document-${timestamp}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e) {
          console.error("Error generating filled document:", e);
          setError("เกิดข้อผิดพลาดขณะสร้างเอกสาร");
      } finally {
          setIsGeneratingDocument(false);
      }
    };

    image.onerror = () => {
        setError("ไม่สามารถโหลดภาพพื้นหลังของเอกสารได้");
        setIsGeneratingDocument(false);
    }
  };

  const handleClear = () => {
    setImageFile(null);
    setImagePreview(null);
    setInfoText('');
    setResult([]);
    setError(null);
  };
  
  const handleReuseFormFillerInfo = (item: FormFillerHistoryItem) => {
    setImagePreview(item.image);
    setInfoText(item.infoText);
    setImageFile(null); // Can't reconstruct file
    setShowHistory(false);
  };

    const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
        }
    }, []);


  return (
    <>
      {showHistory && <History mode="formFiller" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseFormFillerInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Input Section */}
        <div className="flex flex-col gap-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">นำเข้าข้อมูล</h2>
             <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                  <HistoryIcon className="w-6 h-6 text-sky-500" />
              </IconButton>
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">ขั้นตอนที่ 1: อัปโหลดเอกสาร</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">อัปโหลดรูปภาพแบบฟอร์ม</p>
          </div>

           <div 
                ref={dropzoneRef} 
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver} 
                onDrop={handleDrop} 
                className={`relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 ${isDragging ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-800' : ''}`}
                onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input id="file-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
              {imagePreview ? (
                <div className="relative group">
                  <img src={imagePreview} alt="Document preview" className="max-h-60 mx-auto rounded-lg shadow-md" />
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><span className="text-white font-semibold">เปลี่ยนรูปภาพ</span></div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                  <ArrowDownTrayIcon className="w-8 h-8" />
                  <p className="font-semibold">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                  <p className="text-xs">รองรับไฟล์ PNG, JPG, WEBP</p>
                </div>
              )}
           </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">ขั้นตอนที่ 2: ระบุข้อมูลสำหรับกรอก</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">วางข้อมูลดิบทั้งหมดที่นี่</p>
          </div>
          <textarea value={infoText} onChange={(e) => setInfoText(e.target.value)} placeholder="เช่น 'ชื่อ: นายใจดี มีสุข, ที่อยู่: 123 ถนนสุขุมวิท, ...'" rows={8} className="w-full p-3 text-base transition-all duration-300 rounded-lg shadow-sm resize-y bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/80 focus:border-indigo-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40" disabled={isLoading} />

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
               <button onClick={handleAnalyze} disabled={isLoading || !imageFile || !infoText.trim()} className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                  {isLoading ? <Loader className="w-5 h-5" /> : <SparklesIcon className="w-5 h-5" />}
                  <span>{isLoading ? 'กำลังวิเคราะห์...' : 'วิเคราะห์และกรอกข้อมูล'}</span>
              </button>
              <IconButton onClick={handleClear} disabled={isLoading} aria-label="ล้าง" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /></IconButton>
          </div>
        </div>

        {/* Output Section */}
        <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
           <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผลลัพธ์</h2>
              <div className="flex items-center">
                <IconButton onClick={handleCopy} disabled={!result.length || isLoading} aria-label="คัดลอกเป็น JSON" className="hover:bg-gray-200 dark:hover:bg-gray-700">{isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}</IconButton>
                 <IconButton onClick={handleDownload} disabled={!result.length || isLoading} aria-label="ดาวน์โหลด JSON" className="hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowDownTrayIcon className="w-5 h-5" /></IconButton>
                 <IconButton onClick={handleDownloadFilledDocument} disabled={!result.length || isLoading || !imagePreview || isGeneratingDocument} aria-label="ดาวน์โหลดเอกสารที่กรอกแล้ว" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                    {isGeneratingDocument ? <Loader className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                 </IconButton>
              </div>
            </div>
          <div className="relative w-full h-full min-h-[400px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-dashed border-gray-300/50 dark:border-gray-700/50 transition-all duration-300">
              {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-transparent"><Loader className="w-8 h-8 text-indigo-500" /></div>}
              {!isLoading && error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
              {!isLoading && !error && result.length === 0 && <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">ข้อมูลที่กรอกแล้วจะปรากฏที่นี่...</div>}
              {!isLoading && result.length > 0 && (
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                      {result.map((item, index) => (
                          <div key={index} className="grid grid-cols-3 gap-2 items-start text-sm animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                              <span className="col-span-1 font-semibold text-gray-600 dark:text-gray-300 text-right">{item.field}:</span>
                              <span className="col-span-2 text-gray-800 dark:text-gray-100 bg-white/50 dark:bg-black/20 px-2 py-1 rounded-md">{item.value}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};
// #endregion Form Filler Component


// #region AI Document Designer Component
const AIDocumentDesigner: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.Resume);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);

    const [history, setHistory] = useState<DocumentDesignerHistoryItem[]>(() => {
        try {
            const localHistory = window.localStorage.getItem('gemini-doc-designer-history');
            return localHistory ? JSON.parse(localHistory) : [];
        } catch (e) {
            console.error("Failed to parse document designer history from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem('gemini-doc-designer-history', JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save document designer history to localStorage", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [history]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('กรุณาป้อนข้อมูลสำหรับสร้างเอกสาร');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const generatedDoc = await generateDocument(prompt, documentType);
            setResult(generatedDoc);

            const newHistoryItem: DocumentDesignerHistoryItem = {
                id: Date.now(),
                prompt,
                documentType,
                result: generatedDoc,
                timestamp: new Date().toISOString(),
            };
            setHistory(prev => [newHistoryItem, ...prev]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        navigator.clipboard.writeText(result);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!result) return;
        const blob = new Blob([result], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const docTypeName = documentType.replace(/\s/g, '_');
        link.setAttribute('download', `${docTypeName}-${timestamp}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        setPrompt('');
        setResult('');
        setError(null);
    };
    
    const handleReuseInfo = (item: DocumentDesignerHistoryItem) => {
        setPrompt(item.prompt);
        setDocumentType(item.documentType);
        setResult(item.result);
        setShowHistory(false);
    };

    const SkeletonLoader = () => (
        <div className="space-y-4">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/3 skeleton-line"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full skeleton-line"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-11/12 skeleton-line"></div>
            </div>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-md w-1/4 skeleton-line mt-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full skeleton-line"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 skeleton-line"></div>
            </div>
        </div>
    );

    return (
        <>
            {showHistory && <History mode="documentDesigner" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
            
            <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in-up">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผู้สร้างเอกสาร AI</h2>
                        <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                            <HistoryIcon className="w-6 h-6 text-orange-500" />
                        </IconButton>
                    </div>

                    <div className="mb-4">
                        <Selector id="doc-type-selector" label="ประเภทเอกสาร" value={documentType} options={Object.values(DocumentType)} onChange={(v) => setDocumentType(v as DocumentType)} />
                    </div>

                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={`ระบุข้อมูลสำคัญที่ต้องการให้มีในเอกสาร ${documentType} ของคุณ...\nเช่น "ชื่อ: สมชาย ใจดี, ตำแหน่งที่สมัคร: วิศวกรซอฟต์แวร์, ประสบการณ์: 3 ปีที่บริษัท ABC"`}
                        rows={8}
                        className="w-full p-3 text-base transition-all duration-300 rounded-lg shadow-sm resize-y bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/80 focus:border-orange-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40"
                        disabled={isLoading}
                    />

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                            {isLoading ? <Loader className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                            <span>{isLoading ? 'กำลังสร้าง...' : 'สร้างเอกสาร'}</span>
                        </button>
                        <IconButton onClick={handleClear} disabled={isLoading} aria-label="ล้าง" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /></IconButton>
                    </div>
                </div>

                {/* Result */}
                <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผลลัพธ์</h2>
                        <div className="flex items-center">
                            <IconButton onClick={handleCopy} disabled={!result || isLoading} aria-label="คัดลอก" className="hover:bg-gray-200 dark:hover:bg-gray-700">{isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}</IconButton>
                            <IconButton onClick={handleDownload} disabled={!result || isLoading} aria-label="ดาวน์โหลด Markdown" className="hover:bg-gray-200 dark:hover:bg-gray-700"><ArrowDownTrayIcon className="w-5 h-5" /></IconButton>
                        </div>
                    </div>
                    <div className="relative w-full min-h-[400px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-dashed border-gray-300/50 dark:border-gray-700/50 max-h-[70vh] overflow-y-auto">
                        {isLoading && <SkeletonLoader />}
                        {!isLoading && error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
                        {!isLoading && !error && !result && <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">เอกสารที่สร้างจะปรากฏที่นี่...</div>}
                        {!isLoading && result && <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap">{result}</div>}
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion AI Document Designer Component

// #region Image Captioner Component
const ImageCaptioner: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [caption, setCaption] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState(false);

    const [history, setHistory] = useState<ImageCaptionerHistoryItem[]>(() => {
        try {
            const localHistory = window.localStorage.getItem('gemini-captioner-history');
            return localHistory ? JSON.parse(localHistory) : [];
        } catch (e) {
            console.error("Failed to parse captioner history from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem('gemini-captioner-history', JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save captioner history to localStorage", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [history]);

    const handleFileChange = (files: FileList | null) => {
        const file = files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            fileToBase64(file).then(setImagePreview);
            setCaption('');
            setError(null);
        } else if (file) {
            setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleGenerate = async () => {
        if (!imagePreview) {
            setError('กรุณาอัปโหลดรูปภาพ');
            return;
        }
        setIsLoading(true);
        setError(null);
        setCaption('');

        try {
            const generatedCaption = await generateImageCaption(imagePreview);
            setCaption(generatedCaption);

            const newHistoryItem: ImageCaptionerHistoryItem = {
                id: Date.now(),
                image: imagePreview,
                caption: generatedCaption,
                timestamp: new Date().toISOString(),
            };
            setHistory(prev => [newHistoryItem, ...prev]);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = () => {
        if (!caption) return;
        navigator.clipboard.writeText(caption);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    
    const handleClear = () => {
        setImageFile(null);
        setImagePreview(null);
        setCaption('');
        setError(null);
    };

    const handleReuseInfo = (item: ImageCaptionerHistoryItem) => {
        setImagePreview(item.image);
        setCaption(item.caption);
        setImageFile(null); // Can't reconstruct file
        setShowHistory(false);
    };
    
    const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, []);

    const CaptionSkeletonLoader = () => (
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-full skeleton-line"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-11/12 skeleton-line"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4 skeleton-line"></div>
        </div>
    );

    return (
        <>
            {showHistory && <History mode="imageCaptioner" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
            
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 animate-fade-in-up">
                {/* Input Section */}
                <div className="flex flex-col gap-6 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">อัปโหลดรูปภาพ</h2>
                        <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                            <HistoryIcon className="w-6 h-6 text-cyan-500" />
                        </IconButton>
                    </div>

                    <div 
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver} 
                        onDrop={handleDrop} 
                        className={`relative w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-cyan-400 dark:hover:border-cyan-500 transition-all duration-300 flex items-center justify-center ${isDragging ? 'ring-2 ring-offset-2 ring-cyan-500 dark:ring-offset-gray-800' : ''}`}
                        onClick={() => document.getElementById('caption-file-upload')?.click()}
                    >
                        <input id="caption-file-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                        {imagePreview ? (
                            <div className="relative group w-full h-full">
                                <img src={imagePreview} alt="Preview for captioning" className="w-full h-full object-contain rounded-lg" />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><span className="text-white font-semibold">เปลี่ยนรูปภาพ</span></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <PhotoIcon className="w-10 h-10" />
                                <p className="font-semibold">คลิกเพื่ออัปโหลด หรือลากไฟล์มาวาง</p>
                                <p className="text-sm">อัปโหลดรูปภาพเพื่อสร้างคำบรรยาย</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button onClick={handleGenerate} disabled={isLoading || !imagePreview} className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                            {isLoading ? <Loader className="w-5 h-5" /> : <InformationCircleIcon className="w-5 h-5" />}
                            <span>{isLoading ? 'กำลังสร้าง...' : 'สร้างคำบรรยาย'}</span>
                        </button>
                        <IconButton onClick={handleClear} disabled={isLoading} aria-label="ล้าง" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /></IconButton>
                    </div>
                </div>

                {/* Output Section */}
                <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">คำบรรยายภาพ</h2>
                        <div className="flex items-center">
                            <IconButton onClick={handleCopy} disabled={!caption || isLoading} aria-label="คัดลอก" className="hover:bg-gray-200 dark:hover:bg-gray-700">{isCopied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}</IconButton>
                        </div>
                    </div>
                    <div className="relative w-full h-full min-h-[300px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-dashed border-gray-300/50 dark:border-gray-700/50 transition-all duration-300">
                        {isLoading && <CaptionSkeletonLoader />}
                        {!isLoading && error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
                        {!isLoading && !error && !caption && <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">คำบรรยายภาพจะปรากฏที่นี่...</div>}
                        {!isLoading && caption && <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-100">{caption}</div>}
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion Image Captioner Component

// #region Image Generator Component
const ImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<ImageHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Square);
    const [artStyle, setArtStyle] = useState<ArtStyle>(ArtStyle.None);
    const [numberOfImages, setNumberOfImages] = useState<string>('1');
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() => {
        return 'Notification' in window ? Notification.permission : 'default';
    });
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
    const [copiedCaptionId, setCopiedCaptionId] = useState<number | null>(null);

    const [downloadModalState, setDownloadModalState] = useState<{
        isOpen: boolean;
        image: ImageHistoryItem | null;
    }>({ isOpen: false, image: null });
    const [downloadFormat, setDownloadFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
    const [downloadQuality, setDownloadQuality] = useState(92); // 0-100 scale for UI
    const [isDownloading, setIsDownloading] = useState(false);

    const [history, setHistory] = useState<ImageHistoryItem[]>(() => {
        try {
            const localHistory = window.localStorage.getItem('gemini-image-history');
            return localHistory ? JSON.parse(localHistory) : [];
        } catch (e) {
            console.error("Failed to parse image history from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem('gemini-image-history', JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save image history to localStorage", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [history]);

    const handleGetSuggestions = async () => {
        if (!prompt.trim() || isSuggesting || isLoading) return;
    
        setIsSuggesting(true);
        setError(null);
        setSuggestions([]);
    
        try {
            const generatedSuggestions = await generatePromptSuggestions(prompt); 
            setSuggestions(generatedSuggestions);
            setShowSuggestionsModal(true);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('กรุณาป้อนคำสั่งสำหรับสร้างภาพ');
            return;
        }

        if (notificationStatus !== 'granted') {
             await requestNotificationPermission();
             setNotificationStatus(Notification.permission);
        }

        setIsLoading(true);
        setError(null);
        setResults([]);

        try {
            const generatedDataUrls = await generateImages(prompt, parseInt(numberOfImages, 10), aspectRatio, artStyle);
            const newImages: ImageHistoryItem[] = generatedDataUrls.map((dataUrl, index) => ({
                id: Date.now() + index,
                dataUrl,
                prompt,
                aspectRatio,
                artStyle,
                timestamp: new Date().toISOString()
            }));
            setResults(newImages);
            setHistory(prev => [...newImages, ...prev]);

            showNotification('การสร้างภาพเสร็จสมบูรณ์!', {
                body: 'ภาพที่สร้างโดย AI ของคุณพร้อมให้รับชมแล้ว',
                tag: 'image-generation-complete',
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOpenDownloadModal = (image: ImageHistoryItem) => {
        setDownloadModalState({ isOpen: true, image: image });
    };

    const handlePerformDownload = () => {
        if (!downloadModalState.image) return;
        setIsDownloading(true);
        setError(null);

        const image = new Image();
        image.crossOrigin = 'anonymous';
        image.src = downloadModalState.image.dataUrl;

        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('ไม่สามารถเริ่มต้น Canvas สำหรับการแปลงไฟล์ได้');
                setIsDownloading(false);
                return;
            }
            ctx.drawImage(image, 0, 0);

            const mimeType = `image/${downloadFormat}`;
            const quality = downloadFormat === 'png' ? undefined : downloadQuality / 100;

            canvas.toBlob((blob) => {
                if (!blob) {
                    setError('เกิดข้อผิดพลาดในการแปลงไฟล์ภาพ');
                    setIsDownloading(false);
                    return;
                }
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                link.download = `generated-image-${timestamp}.${downloadFormat}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setIsDownloading(false);
                setDownloadModalState({ isOpen: false, image: null });
            }, mimeType, quality);
        };
        image.onerror = () => {
            setError('ไม่สามารถโหลดภาพเพื่อทำการแปลงไฟล์ได้');
            setIsDownloading(false);
        };
    };

    const handleReuseImageInfo = (item: ImageHistoryItem) => {
        setPrompt(item.prompt);
        setAspectRatio(item.aspectRatio);
        setArtStyle(item.artStyle);
        setShowHistory(false);
    };

    const handleGenerateCaption = async (id: number) => {
        const imageToCaption = results.find(img => img.id === id);
        if (!imageToCaption) return;
    
        setResults(prev => prev.map(img => img.id === id ? { ...img, isCaptionLoading: true } : img));
    
        try {
            const caption = await generateImageCaption(imageToCaption.dataUrl);
            
            setResults(prev => prev.map(img => img.id === id ? { ...img, caption, isCaptionLoading: false } : img));
            setHistory(prev => prev.map(histItem => histItem.id === id ? { ...histItem, caption } : histItem));
    
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setResults(prev => prev.map(img => img.id === id ? { ...img, caption: `Error: ${errorMessage}`, isCaptionLoading: false } : img));
            setError(errorMessage);
        }
    };
    
    const handleCopyCaption = (caption: string, id: number) => {
        if (!caption) return;
        navigator.clipboard.writeText(caption);
        setCopiedCaptionId(id);
        setTimeout(() => setCopiedCaptionId(null), 2000);
    };

    const SkeletonImagePlaceholder = () => (
        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-lg shadow-md skeleton-line">
            <div style={{ paddingTop: '100%' }}></div> {/* 1:1 Aspect Ratio Placeholder */}
        </div>
    );

    return (
        <>
            {showSuggestionsModal && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setShowSuggestionsModal(false)}
                >
                    <div 
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-3 right-3">
                            <IconButton onClick={() => setShowSuggestionsModal(false)} aria-label="ปิด" className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
                                <XMarkIcon className="w-6 h-6" />
                            </IconButton>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            <MagicWandIcon className="w-6 h-6 inline-block mr-2 text-purple-500" />
                            คำแนะนำสำหรับ Prompt
                        </h3>
                        
                        <div className="space-y-3">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setPrompt(suggestion);
                                        setShowSuggestionsModal(false);
                                    }}
                                    className="w-full text-left p-4 rounded-lg bg-gray-100 dark:bg-gray-900/50 hover:bg-gray-200 dark:hover:bg-gray-700/50 hover:ring-2 hover:ring-purple-400 transition-all duration-200"
                                >
                                    <p className="text-gray-800 dark:text-gray-200">{suggestion}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {downloadModalState.isOpen && downloadModalState.image && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setDownloadModalState({ isOpen: false, image: null })}
                >
                    <div 
                        className="relative w-full max-w-lg p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black/5 animate-fade-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-3 right-3">
                            <IconButton onClick={() => setDownloadModalState({ isOpen: false, image: null })} aria-label="ปิด" className="text-gray-500 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/10">
                                <XMarkIcon className="w-6 h-6" />
                            </IconButton>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                           ตัวเลือกการส่งออก
                        </h3>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="flex-shrink-0 w-full md:w-1/2">
                                <img src={downloadModalState.image.dataUrl} alt="Preview" className="w-full rounded-lg shadow-md" />
                            </div>
                            <div className="flex flex-col gap-4 w-full md:w-1/2">
                                 <div className="flex flex-col gap-2">
                                    <label htmlFor="format-select" className="font-medium text-sm text-gray-700 dark:text-gray-300">รูปแบบไฟล์</label>
                                    <select
                                        id="format-select"
                                        value={downloadFormat}
                                        onChange={(e) => setDownloadFormat(e.target.value as 'jpeg' | 'png' | 'webp')}
                                        className="w-full pl-3 pr-8 py-2 text-base transition-all duration-300 rounded-lg shadow-sm appearance-none bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/80"
                                    >
                                        <option value="jpeg">JPEG</option>
                                        <option value="png">PNG</option>
                                        <option value="webp">WebP</option>
                                    </select>
                                </div>
                                {downloadFormat !== 'png' && (
                                    <div className="flex flex-col gap-2 animate-fade-in-up">
                                        <div className="flex justify-between items-center">
                                            <label htmlFor="quality-slider" className="font-medium text-sm text-gray-700 dark:text-gray-300">คุณภาพ</label>
                                            <span className="text-sm font-mono text-gray-600 dark:text-gray-400">{downloadQuality}%</span>
                                        </div>
                                        <input
                                            id="quality-slider"
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={downloadQuality}
                                            onChange={(e) => setDownloadQuality(parseInt(e.target.value, 10))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-500"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDownloadModalState({ isOpen: false, image: null })} className="w-full py-2.5 px-4 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold transition-colors">
                                ยกเลิก
                            </button>
                             <button onClick={handlePerformDownload} disabled={isDownloading} className="w-full flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isDownloading ? <Loader className="w-5 h-5" /> : <ArrowDownTrayIcon className="w-5 h-5" />}
                                <span>{isDownloading ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลด'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showHistory && <History mode="imageGenerator" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseImageInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
            <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in-up">
                {/* Input Section */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผู้สร้างภาพ AI</h2>
                        <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                            <HistoryIcon className="w-6 h-6 text-purple-500" />
                        </IconButton>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <Selector id="art-style-selector" label="สไตล์งานศิลป์" value={artStyle} options={Object.values(ArtStyle)} onChange={(v) => setArtStyle(v as ArtStyle)} />
                        <Selector id="aspect-ratio-selector" label="อัตราส่วนภาพ" value={aspectRatio} options={Object.values(AspectRatio)} onChange={(v) => setAspectRatio(v as AspectRatio)} />
                        <Selector id="num-images-selector" label="จำนวนภาพ" value={numberOfImages} options={['1', '2', '4']} onChange={(v) => setNumberOfImages(v)} />
                    </div>
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="ป้อนคำสั่งสำหรับสร้างภาพที่นี่, เช่น 'แมวอวกาศใส่หมวกกันน็อค, ภาพถ่ายสมจริง'"
                            rows={4}
                            className="w-full p-3 pr-14 text-base transition-all duration-300 rounded-lg shadow-sm resize-y bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400/80 focus:border-purple-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40"
                            disabled={isLoading}
                        />
                         <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <IconButton
                                onClick={handleGetSuggestions}
                                disabled={isLoading || isSuggesting || !prompt.trim()}
                                aria-label="รับคำแนะนำสำหรับ Prompt"
                                className="hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                {isSuggesting ? <Loader className="w-5 h-5 text-purple-500" /> : <MagicWandIcon className="w-5 h-5 text-purple-500" />}
                            </IconButton>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                        <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                            {isLoading ? <Loader className="w-5 h-5" /> : <PhotoIcon className="w-5 h-5" />}
                            <span>{isLoading ? 'กำลังสร้างภาพ...' : 'สร้างภาพ'}</span>
                        </button>
                        {notificationStatus === 'denied' && (
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                การแจ้งเตือนถูกปิดกั้น คุณจะไม่ได้รับการแจ้งเตือนเมื่อสร้างภาพเสร็จสิ้น
                            </p>
                        )}
                    </div>
                </div>

                {/* Output Section */}
                <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผลลัพธ์</h2>
                    <div className="relative w-full min-h-[300px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-dashed border-gray-300/50 dark:border-gray-700/50">
                        {!isLoading && error && <div className="flex items-center justify-center h-full text-center text-red-500">{error}</div>}
                        {!isLoading && !error && results.length === 0 && <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">ภาพที่สร้างจะปรากฏที่นี่...</div>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {isLoading && Array.from({ length: parseInt(numberOfImages, 10) }).map((_, i) => <SkeletonImagePlaceholder key={i} />)}
                            {!isLoading && results.length > 0 && (
                                results.map((image) => (
                                    <div key={image.id} className="flex flex-col gap-3">
                                        <div className="relative group overflow-hidden rounded-lg shadow-md">
                                            <img src={image.dataUrl} alt={image.prompt} className="w-full h-full object-cover" style={{ aspectRatio: image.aspectRatio.replace(':', ' / ') }} />
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <IconButton onClick={() => handleOpenDownloadModal(image)} aria-label="ตัวเลือกการดาวน์โหลด" className="bg-white/20 hover:bg-white/40 text-white">
                                                    <ArrowDownTrayIcon className="w-8 h-8" />
                                                </IconButton>
                                                <IconButton 
                                                    onClick={() => handleGenerateCaption(image.id)} 
                                                    aria-label="สร้างคำอธิบายภาพ" 
                                                    className="bg-white/20 hover:bg-white/40 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={!!image.caption || !!image.isCaptionLoading}
                                                >
                                                    <DocumentTextIcon className="w-8 h-8" />
                                                </IconButton>
                                            </div>
                                        </div>
                                        
                                        {image.isCaptionLoading && (
                                            <div className="space-y-2">
                                                <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-md skeleton-line"></div>
                                                <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-md skeleton-line"></div>
                                            </div>
                                        )}
                                        {image.caption && !image.isCaptionLoading && (
                                            <div className="relative p-3 rounded-lg bg-gray-100 dark:bg-gray-900/50">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 pr-8">{image.caption}</p>
                                                <div className="absolute top-2 right-2">
                                                    <IconButton onClick={() => handleCopyCaption(image.caption!, image.id)} aria-label="คัดลอกคำอธิบาย" className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
                                                        {copiedCaptionId === image.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4" />}
                                                    </IconButton>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
// #endregion Image Generator Component

// #region AI Video Generator Component
const AIVideoGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [resultUrl, setResultUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progressMessage, setProgressMessage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState(false);
    const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
    const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Widescreen);
    const [isEnhancing, setIsEnhancing] = useState(false);

    const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(() => {
        return 'Notification' in window ? Notification.permission : 'default';
    });
    
    const [history, setHistory] = useState<VideoHistoryItem[]>(() => {
        try {
            const localHistory = window.localStorage.getItem('gemini-video-history');
            return localHistory ? JSON.parse(localHistory) : [];
        } catch (e) {
            console.error("Failed to parse video history from localStorage", e);
            return [];
        }
    });

    useEffect(() => {
        const handler = setTimeout(() => {
            try {
                window.localStorage.setItem('gemini-video-history', JSON.stringify(history));
            } catch (e) {
                console.error("Failed to save video history to localStorage", e);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [history]);
    
    useEffect(() => {
        const checkKey = async () => {
            setIsCheckingApiKey(true);
            try {
                // @ts-ignore
                if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
                    setApiKeySelected(true);
                } else {
                    setApiKeySelected(false);
                }
            } catch (e) {
                console.error("Error checking for API key:", e);
                setApiKeySelected(false);
            } finally {
                setIsCheckingApiKey(false);
            }
        };
        checkKey();
    }, []);

    const handleFileChange = (files: FileList | null) => {
        const file = files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            fileToBase64(file).then(setImagePreview);
        } else if (file) {
            setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSelectKey = async () => {
        try {
            // @ts-ignore
            if (window.aistudio) {
                // @ts-ignore
                await window.aistudio.openSelectKey();
                // Assume success and update UI immediately to avoid race conditions.
                setApiKeySelected(true); 
            }
        } catch (e) {
            console.error("Error opening select key dialog:", e);
            setError("ไม่สามารถเปิดหน้าต่างเลือก API Key ได้");
        }
    };

    const handleEnhancePrompt = async () => {
        if (!prompt.trim() || isLoading || isEnhancing) return;
        setIsEnhancing(true);
        setError(null);
        try {
            const suggestion = await generateVideoPromptSuggestion(prompt);
            setPrompt(suggestion);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('กรุณาป้อนคำสั่งสำหรับสร้างวิดีโอ');
            return;
        }

        if (notificationStatus !== 'granted') {
            await requestNotificationPermission();
            setNotificationStatus(Notification.permission);
        }

        setIsLoading(true);
        setError(null);
        setResultUrl(null);
        setProgressMessage('');

        try {
            let imageData: { base64: string; mimeType: string; } | undefined = undefined;
            if (imageFile) {
                const base64 = (await fileToBase64(imageFile)).split(',')[1];
                imageData = { base64, mimeType: imageFile.type };
            }
            
            const videoBlobUrl = await generateVideo(prompt, aspectRatio, (message) => {
                setProgressMessage(message);
            }, imageData);
            
            setResultUrl(videoBlobUrl);

            const newHistoryItem: VideoHistoryItem = {
                id: Date.now(),
                prompt,
                videoUrl: videoBlobUrl,
                imageUrl: imagePreview || undefined,
                aspectRatio,
                timestamp: new Date().toISOString()
            };
            setHistory(prev => [newHistoryItem, ...prev]);

            showNotification('การสร้างวิดีโอเสร็จสมบูรณ์!', {
                body: 'วิดีโอที่สร้างโดย AI ของคุณพร้อมให้รับชมแล้ว',
                tag: 'video-generation-complete',
            });
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found.")) {
                setError("API Key ไม่ถูกต้องหรือไม่มีสิทธิ์ โปรดเลือก Key ใหม่อีกครั้ง");
                setApiKeySelected(false); // Reset to show the select key button again
            } else {
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
            setProgressMessage('');
        }
    };
    
    const handleReuseVideoInfo = (item: VideoHistoryItem) => {
        setPrompt(item.prompt);
        setImagePreview(item.imageUrl || null);
        setAspectRatio(item.aspectRatio || AspectRatio.Widescreen);
        setImageFile(null); // Can't reconstruct file, but can reuse preview
        setShowHistory(false);
    };

    const handleClear = () => {
        setPrompt('');
        setImageFile(null);
        setImagePreview(null);
        setResultUrl(null);
        setError(null);
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if(e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
        }
    }, []);
    
    if (isCheckingApiKey) {
        return (
            <div className="flex justify-center items-center p-8">
                <Loader className="w-8 h-8 text-rose-500" />
                <p className="ml-4">กำลังตรวจสอบการตั้งค่า...</p>
            </div>
        );
    }

    if (!apiKeySelected) {
        return (
            <div className="max-w-xl mx-auto text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">ต้องใช้ API Key</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    ฟีเจอร์สร้างวิดีโอด้วย Veo จำเป็นต้องใช้ API Key ของคุณเอง โปรดเลือก Key เพื่อดำเนินการต่อ
                    การใช้งานอาจมีค่าใช้จ่ายเกิดขึ้น โปรดตรวจสอบข้อมูลเพิ่มเติมที่ <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-rose-500 hover:underline">เอกสารการเรียกเก็บเงิน</a>
                </p>
                <button
                    onClick={handleSelectKey}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105"
                >
                    เลือก API Key
                </button>
            </div>
        );
    }

    return (
        <>
        {showHistory && <History mode="videoGenerator" history={history} onClose={() => setShowHistory(false)} onDelete={(id) => setHistory(prev => prev.filter(item => item.id !== id))} onClearAll={() => setHistory([])} onReuseInfo={handleReuseVideoInfo as any} onCopy={(text) => navigator.clipboard.writeText(text)} />}
        <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in-up">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผู้สร้างวิดีโอ AI</h2>
                    <IconButton onClick={() => setShowHistory(true)} aria-label="ดูประวัติ" className="hover:bg-gray-200 dark:hover:bg-gray-700">
                        <HistoryIcon className="w-6 h-6 text-rose-500" />
                    </IconButton>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    ✨ <span className='font-semibold'>เทคนิคพิเศษ:</span> อัปโหลดรูปภาพเพื่อสร้างวิดีโอจากภาพนิ่ง! <br/>
                    <span className="text-xs">โปรดทราบ: การสร้างวิดีโออาจใช้เวลาหลายนาที</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="ป้อนคำสั่งสำหรับสร้างวิดีโอที่นี่, เช่น 'โฮโลแกรมแมวนีออนกำลังขับรถด้วยความเร็วสูง'"
                                rows={4}
                                className="w-full p-3 pr-12 text-base transition-all duration-300 rounded-lg shadow-sm resize-y bg-gray-500/10 dark:bg-gray-900/30 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-400/80 focus:border-rose-400/0 focus:bg-gray-500/20 dark:focus:bg-gray-900/40"
                                disabled={isLoading}
                            />
                             <div className="absolute top-2 right-2">
                                <IconButton
                                    onClick={handleEnhancePrompt}
                                    disabled={isLoading || isEnhancing || !prompt.trim()}
                                    aria-label="เติมพร้อมให้สมบูรณ์อัตโนมัติ"
                                    className="hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    {isEnhancing ? <Loader className="w-5 h-5 text-rose-500" /> : <MagicWandIcon className="w-5 h-5 text-rose-500" />}
                                </IconButton>
                            </div>
                        </div>
                        <Selector
                            id="video-aspect-ratio"
                            label="อัตราส่วนภาพ"
                            value={aspectRatio}
                            options={[AspectRatio.Widescreen, AspectRatio.Tall]}
                            onChange={(v) => setAspectRatio(v as AspectRatio)}
                        />
                    </div>
                    <div 
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver} 
                        onDrop={handleDrop} 
                        className={`relative border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 dark:hover:border-rose-500 transition-all duration-300 flex items-center justify-center h-full ${isDragging ? 'ring-2 ring-offset-2 ring-rose-500 dark:ring-offset-gray-800' : ''}`}
                        onClick={() => document.getElementById('video-image-upload')?.click()}
                    >
                        <input id="video-image-upload" type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                         {imagePreview ? (
                            <div className="relative group">
                            <img src={imagePreview} alt="Image preview" className="max-h-36 mx-auto rounded-lg shadow-md" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"><span className="text-white font-semibold">เปลี่ยนรูปภาพ</span></div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                <PhotoIcon className="w-8 h-8" />
                                <p className="font-semibold">เพิ่มรูปภาพ (ไม่บังคับ)</p>
                                <p className="text-xs">ลากไฟล์มาวาง หรือคลิกเพื่ออัปโหลด</p>
                            </div>
                        )}
                    </div>
                </div>
                 <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="w-full flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 dark:focus:ring-offset-gray-900 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100">
                        {isLoading ? <Loader className="w-5 h-5" /> : <VideoCameraIcon className="w-5 h-5" />}
                        <span>{isLoading ? 'กำลังสร้างวิดีโอ...' : 'สร้างวิดีโอ'}</span>
                    </button>
                    <IconButton onClick={handleClear} disabled={isLoading} aria-label="ล้าง" className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"><TrashIcon className="w-5 h-5" /></IconButton>
                </div>
                {notificationStatus === 'denied' && (
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                        การแจ้งเตือนถูกปิดกั้น คุณจะไม่ได้รับการแจ้งเตือนเมื่อสร้างวิดีโอเสร็จสิ้น
                    </p>
                )}
            </div>

            <div className="flex flex-col gap-4 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">ผลลัพธ์</h2>
                 <div className="relative w-full min-h-[300px] p-4 rounded-lg bg-gray-500/10 dark:bg-gray-900/30 border border-dashed border-gray-300/50 dark:border-gray-700/50 flex items-center justify-center">
                    {isLoading && (
                        <div className="text-center">
                            <Loader className="w-12 h-12 text-rose-500 mx-auto" />
                            <p className="mt-4 font-semibold text-lg text-gray-700 dark:text-gray-300">{progressMessage}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">กรุณารอสักครู่...</p>
                        </div>
                    )}
                    {!isLoading && error && <div className="text-center text-red-500">{error}</div>}
                    {!isLoading && !error && !resultUrl && <div className="text-center text-gray-500 dark:text-gray-400">วิดีโอที่สร้างจะปรากฏที่นี่...</div>}
                    {!isLoading && resultUrl && (
                        <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-[60vh] rounded-lg" />
                    )}
                </div>
            </div>
        </div>
        </>
    );
}
// #endregion AI Video Generator Component

// #region AI Chat Component
const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCopiedId, setIsCopiedId] = useState<number | null>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatService.startChat();
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
        textarea.style.height = 'auto'; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to scroll height
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = { id: Date.now(), role: 'user', content: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
    
    setIsLoading(true);

    try {
      const stream = await chatService.sendMessageStream(trimmedInput);
      let modelResponse = '';
      const modelMessageId = Date.now() + 1;
      setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        modelResponse += chunkText;
        setMessages(prev => {
           const updatedMessages = [...prev];
           const lastMessage = updatedMessages[updatedMessages.length - 1];
           if (lastMessage && lastMessage.id === modelMessageId) {
                lastMessage.content = modelResponse;
           }
           return updatedMessages;
        });
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ';
      setError(errorMessage);
       setMessages(prev => [...prev, { id: Date.now(), role: 'model', content: `ขออภัย, เกิดข้อผิดพลาด: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };
  
  const handleClearChat = () => {
    setMessages([]);
    chatService.startChat();
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-180px)] bg-white dark:bg-gray-800 rounded-2xl shadow-lg animate-fade-in-up">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">AI แชท</h2>
        <IconButton onClick={handleClearChat} aria-label="ล้างการสนทนา" className="hover:bg-gray-200 dark:hover:bg-gray-700">
          <TrashIcon className="w-5 h-5" />
        </IconButton>
      </div>
      
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <SparklesIcon className="w-16 h-16 text-teal-400 mb-4" />
            <h3 className="text-2xl font-semibold">สวัสดี!</h3>
            <p>มีอะไรให้ช่วยไหม? ลองถามอะไรก็ได้เลย</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-teal-500" />
                </div>
              )}
              <div className={`max-w-lg group relative ${msg.role === 'user' ? 'order-last' : ''}`}>
                 <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-lg' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-lg'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                 </div>
                 {msg.role === 'model' && msg.content && (
                     <div className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <IconButton onClick={() => handleCopy(msg.content, msg.id)} aria-label="คัดลอก" className="bg-white dark:bg-gray-800 shadow-md p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600">
                            {isCopiedId === msg.id ? <CheckIcon className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-gray-500" />}
                         </IconButton>
                     </div>
                 )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
           <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-teal-500" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-gray-200 dark:bg-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                  </div>
              </div>
           </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="พิมพ์ข้อความของคุณ..."
            rows={1}
            className="w-full p-3 pr-12 text-base transition-all duration-300 rounded-lg shadow-sm resize-none max-h-40 bg-gray-100 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400/80"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <IconButton onClick={handleSendMessage} aria-label="ส่งข้อความ" disabled={!input.trim() || isLoading} className="bg-teal-500 text-white hover:bg-teal-600 disabled:bg-gray-400 dark:disabled:bg-gray-600">
              <PaperAirplaneIcon className="w-5 h-5" />
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
};

// #endregion AI Chat Component

export default App;