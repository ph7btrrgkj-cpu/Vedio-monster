/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, Plus, Download, Image as ImageIcon, 
  Video, Music, Layers, Settings, Share2, Sparkles,
  Trash2, Copy, Move, Maximize2, Palette, Zap, Clock,
  ArrowRight, RotateCcw, Maximize, Eye, Search, LayoutTemplate,
  Type as TypeIcon, Upload, Check, Loader2, Scissors
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Project, Layer, AspectRatio, Scene } from './types/editor';
import { TEMPLATES, MOTIONS, BACKGROUNDS, SOUND_EFFECTS } from './constants/templates';
import { generateMotionFromPrompt, analyzeVideoScenes } from './lib/gemini';
import { loadCustomFont, handleFontUpload, CustomFont } from './lib/fonts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [project, setProject] = useState<Project>({
    id: '1',
    name: 'مشروع جديد',
    aspectRatio: '16:9',
    backgroundColor: '#000000',
    layers: [],
    duration: 10,
  });

  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'media' | 'motions' | 'sounds' | 'backgrounds' | 'fonts'>('templates');
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);

  const addLayer = useCallback((type: Layer['type'], url: string, name: string, extra: Partial<Layer> = {}) => {
    const newLayer: Layer = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      url,
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
      startTime: 0,
      duration: 5,
      effects: [],
      ...extra
    };
    setProject(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));
    setActiveLayerId(newLayer.id);
  }, []);

  const handleVideoAnalysis = async (layer: Layer) => {
    if (layer.type !== 'video' || !layer.url || isAnalyzing) return;
    setIsAnalyzing(true);
    try {
      const scenes = await analyzeVideoScenes(layer.url);
      setProject(prev => ({
        ...prev,
        layers: prev.layers.map(l => l.id === layer.id ? { ...l, scenes } : l)
      }));
    } catch (error) {
      console.error('Video analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFontFile = async (file: File) => {
    try {
      const font = await handleFontUpload(file);
      await loadCustomFont(font);
      setCustomFonts(prev => [...prev, font]);
    } catch (error) {
      console.error('Font upload error:', error);
    }
  };

  const handleAiGeneration = async () => {
    if (!aiPrompt || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const plan = await generateMotionFromPrompt(aiPrompt);
      if (activeLayerId) {
        setProject(prev => ({
          ...prev,
          layers: prev.layers.map(l => l.id === activeLayerId ? {
            ...l,
            effects: plan.effects
          } : l)
        }));
      }
    } catch (error) {
      console.error('AI Generation error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const activeLayer = useMemo(() => 
    project.layers.find(l => l.id === activeLayerId),
    [project.layers, activeLayerId]
  );

  // Playback Logic
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(t => {
          if (t >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return t + 0.033; // ~30fps
        });
      }, 33);
    }
    return () => clearInterval(interval);
  }, [isPlaying, project.duration]);

  // Effect mapping function
  const getAnimationProps = (layer: Layer) => {
    if (!isPlaying) return {};

    const activeEffects = layer.effects.filter(fx => 
      currentTime >= layer.startTime + fx.delay && 
      currentTime <= layer.startTime + fx.delay + fx.duration
    );

    const props: any = {
      initial: { opacity: layer.opacity, scale: layer.scale, rotate: layer.rotation },
      animate: { opacity: layer.opacity, scale: layer.scale, rotate: layer.rotation },
      transition: { duration: 0.1 }
    };

    activeEffects.forEach(fx => {
      switch (fx.type) {
        case 'rotation':
          props.animate.rotate = layer.rotation + 360;
          props.transition = { duration: fx.duration, repeat: Infinity, ease: fx.easing };
          break;
        case 'zoom':
          props.animate.scale = [layer.scale, layer.scale * 1.2, layer.scale];
          props.transition = { duration: fx.duration, repeat: Infinity, ease: fx.easing };
          break;
        case 'fade':
          props.animate.opacity = [0, layer.opacity];
          props.transition = { duration: fx.duration, ease: fx.easing };
          break;
        case 'shake':
          props.animate.x = [0, -5, 5, -5, 5, 0];
          props.transition = { duration: 0.5, repeat: Infinity };
          break;
      }
    });

    return props;
  };

  return (
    <div className="flex h-screen w-full bg-[#080808] text-white flex-col font-sans selection:bg-gold/30 overflow-hidden p-4 gap-4">
      {/* Top Header */}
      <header className="h-16 border border-white/10 flex items-center justify-between px-6 glass z-50 rounded-2xl shadow-xl accent-glow shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
            <Zap className="w-6 h-6 text-black fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-tight">موتيك <span className="text-gold">AI</span></h1>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Studio Editor</p>
          </div>
        </div>

        <div className="flex-1 max-w-sm mx-8">
          <div className="relative group">
            <input 
              value={project.name}
              onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-sm focus:outline-none focus:border-gold/50 transition-all text-center font-bold"
              placeholder="اسم المشروع..."
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm font-bold border border-white/10">
            <Share2 className="w-4 h-4 text-gold" />
            مشاركة
          </button>
          <button className="flex items-center gap-2 px-6 py-2 rounded-lg btn-primary shadow-lg accent-glow text-sm">
            <Download className="w-4 h-4" />
            تصدير الفيديو
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden gap-4">
        {/* Left Sidebar - Library */}
        <aside className="w-72 border border-white/10 flex flex-col glass z-40 rounded-2xl shadow-xl">
          <nav className="flex items-center justify-between p-2 border-b border-white/10 bg-white/5 rounded-t-2xl">
            {[
              { id: 'templates', icon: LayoutTemplate, label: 'قوالب' },
              { id: 'media', icon: ImageIcon, label: 'وسائط' },
              { id: 'motions', icon: Zap, label: 'حركات' },
              { id: 'fonts', icon: TypeIcon, label: 'خطوط' },
              { id: 'backgrounds', icon: Palette, label: 'خلفية' },
              { id: 'sounds', icon: Music, label: 'صوت' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "p-2 rounded-lg transition-all flex flex-col items-center gap-1 min-w-[50px]",
                  activeTab === tab.id ? "bg-gold/10 text-gold shadow-sm border border-gold/20" : "text-white/40 hover:text-white/60 hover:bg-white/5"
                )}
                title={tab.label}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'templates' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid gap-4"
                >
                  <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">القوالب الجاهزة</h3>
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => addLayer('image', tmpl.thumbnail, tmpl.name)}
                      className="group relative rounded-xl overflow-hidden aspect-video bg-white/5 border border-white/10 hover:border-gold/50 transition-all"
                    >
                      <img src={tmpl.thumbnail} alt={tmpl.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black to-transparent">
                        <p className="text-xs font-bold text-right text-gold">{tmpl.name}</p>
                        <p className="text-[10px] text-white/50 text-right">{tmpl.category}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'media' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                   <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-white/10 rounded-xl hover:border-gold/50 hover:bg-gold/5 transition-all cursor-pointer group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 text-white/20 group-hover:text-gold transition-colors mb-2" />
                      <p className="text-xs font-bold text-white/40 group-hover:text-white/60">رفع صورة أو شعار</p>
                      <p className="text-[10px] text-white/20 mt-1 uppercase tracking-widest font-bold">PNG, JPG, SVG</p>
                    </div>
                    <input type="file" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        addLayer('image', url, file.name);
                      }
                    }} />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Placeholder media */}
                    {[1, 2, 3, 4].map(i => (
                       <button
                        key={i}
                        onClick={() => addLayer('image', `https://picsum.photos/seed/${i + 10}/400/400`, `عنصر ${i}`)}
                        className="aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-orange-500/50 transition-all"
                      >
                         <img src={`https://picsum.photos/seed/${i + 10}/400/400`} alt="media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'motions' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-2 gap-3"
                >
                   {MOTIONS.map((motion) => (
                    <button
                      key={motion.id}
                      onClick={() => {
                        if (!activeLayerId) return;
                        setProject(p => ({
                          ...p,
                          layers: p.layers.map(l => l.id === activeLayerId ? {
                            ...l,
                            effects: [...l.effects, {
                              id: Math.random().toString(36).substr(2, 9),
                              type: motion.id as any,
                              duration: 2,
                              delay: 0,
                              easing: 'ease-in-out'
                            }]
                          } : l)
                        }));
                      }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/50 hover:bg-gold/5 transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Zap className="w-6 h-6 text-gold" />
                      <span className="text-xs font-bold">{motion.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'backgrounds' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid gap-3"
                >
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setProject(p => ({ ...p, backgroundColor: bg.color }))}
                      className={cn(
                        "group p-3 rounded-xl bg-white/5 border transition-all flex items-center gap-4",
                        project.backgroundColor === bg.color ? "border-gold bg-gold/10 accent-glow shadow-gold/10" : "border-white/10 hover:border-gold/50"
                      )}
                    >
                      <div className="w-12 h-12 rounded-lg border border-white/10" style={{ background: bg.color }} />
                      <span className="text-xs font-bold text-white/50 group-hover:text-white transition-colors">{bg.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {activeTab === 'fonts' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-white/10 rounded-xl hover:border-gold/50 hover:bg-gold/5 transition-all cursor-pointer group">
                    <Upload className="w-8 h-8 text-gold/40 group-hover:text-gold transition-colors mb-2" />
                    <p className="text-xs font-bold text-white/60">رفع خط عربي جديد</p>
                    <input type="file" className="hidden" accept=".ttf,.woff,.woff2" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFontFile(file);
                    }} />
                  </label>

                  <div className="space-y-2">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">الخطوط المرفوعة</h3>
                    {customFonts.length === 0 ? (
                      <p className="text-[10px] text-white/20 italic text-center py-4">لا توجد خطوط مخصصة بعد</p>
                    ) : (
                      customFonts.map(font => (
                        <div key={font.family} className="p-3 glass rounded-lg flex items-center justify-between group">
                          <span style={{ fontFamily: font.family }} className="text-sm truncate pr-2">{font.family}</span>
                          <Check className="w-4 h-4 text-gold shrink-0" />
                        </div>
                      ))
                    )}
                  </div>

                  <button 
                    onClick={() => addLayer('text', '', 'نص جديد', { text: 'أدخل نصاً عربياً هنا', fontSize: 40, fontFamily: customFonts[0]?.family || 'IBM Plex Sans Arabic' })}
                    className="w-full py-3 btn-primary rounded-xl flex items-center justify-center gap-2 text-xs"
                  >
                    <TypeIcon className="w-4 h-4" />
                    إضافة طبقة نص
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Canvas Viewport */}
          <div className="flex-1 glass rounded-2xl shadow-xl overflow-hidden relative flex flex-col items-center justify-center bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:40px_40px]">
            {/* AI Bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
              <div className="glass rounded-2xl p-2 flex items-center gap-2 shadow-2xl accent-glow border-white/10">
                <div className="p-2 bg-gold/10 rounded-xl text-gold">
                  <Sparkles className={cn("w-5 h-5", isAiLoading && "animate-pulse")} />
                </div>
                <input 
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiGeneration()}
                  className="flex-1 bg-transparent px-2 text-sm focus:outline-none font-bold text-white/80"
                  placeholder="صف الحركة التي تريدها هنا (مثلاً: دوران شعار مع تلاشي)"
                />
                <button 
                  onClick={handleAiGeneration}
                  disabled={isAiLoading || !aiPrompt}
                  className="px-4 py-2 btn-primary disabled:opacity-50 transition-all rounded-xl text-xs font-bold flex items-center gap-2 shrink-0 accent-glow"
                >
                  {isAiLoading ? 'جاري التحليل...' : 'توليد ذكي'}
                </button>
              </div>
            </div>

            <div 
              className={cn(
                "relative shadow-2xl overflow-hidden accent-glow rounded-xl",
                project.aspectRatio === '16:9' ? "aspect-video w-full max-w-4xl" : 
                project.aspectRatio === '9:16' ? "aspect-[9/16] h-full" : "aspect-square w-full max-w-2xl"
              )}
              style={{ background: project.backgroundColor }}
            >
              {/* Layers Preview */}
              <AnimatePresence>
                 {project.layers.map((layer) => (
                   <motion.div
                    key={layer.id}
                    drag={!isPlaying}
                    dragMomentum={false}
                    className={cn(
                      "absolute cursor-move select-none",
                      activeLayerId === layer.id && "ring-2 ring-gold ring-offset-2 ring-offset-black"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLayerId(layer.id);
                    }}
                    {...getAnimationProps(layer)}
                    style={{
                      left: `${50 + layer.x}%`,
                      top: `${50 + layer.y}%`,
                      transformOrigin: 'center center',
                    }}
                   >
                     {layer.type === 'image' && (
                       <img src={layer.url} alt={layer.name} className="w-64 h-auto max-w-full" draggable={false} referrerPolicy="no-referrer" />
                     )}
                     {layer.type === 'text' && (
                       <div 
                        style={{ 
                          fontSize: `${layer.fontSize}px`, 
                          fontFamily: layer.fontFamily,
                          color: layer.color || 'white'
                        }}
                        className="whitespace-nowrap px-4"
                       >
                         {layer.text}
                       </div>
                     )}
                     {layer.type === 'video' && (
                       <video src={layer.url} className="w-64 h-auto rounded-lg" muted />
                     )}
                   </motion.div>
                 ))}
              </AnimatePresence>

              {/* Grid Overlay (Optional) */}
              <div className="absolute inset-0 pointer-events-none border border-white/5 opacity-10" />
            </div>
          </div>

          {/* Timeline Bottom Area */}
          <div className="h-64 border border-white/10 glass rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-2 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full btn-primary flex items-center justify-center shadow-lg accent-glow"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                     <span className="text-xl font-mono font-bold tracking-tight">{currentTime.toFixed(2)}</span>
                     <span className="text-xs text-white/30 font-bold uppercase tracking-widest">/ {project.duration.toFixed(2)}</span>
                   </div>
                   <span className="text-[10px] text-white/40 font-bold -mt-1 uppercase tracking-tighter opacity-60">Frames: {Math.round(currentTime * 30)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gold">
                <button 
                  onClick={() => {
                    if (confirm('هل أنت متأكد من مسح جميع طبقات المشروع؟')) {
                      setProject(p => ({ ...p, layers: [] }));
                      setActiveLayerId(null);
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-500 transition-all"
                  title="مسح المشروع"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
                <div className="h-4 w-px bg-white/10" />
                <div className="flex items-center gap-1">
                   <button onClick={() => setProject(p => ({...p, aspectRatio: '16:9'}))} className={cn("px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 transition-all", project.aspectRatio === '16:9' ? "bg-gold/20 border-gold/50 text-gold" : "hover:bg-white/5")}>16:9</button>
                   <button onClick={() => setProject(p => ({...p, aspectRatio: '9:16'}))} className={cn("px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 transition-all", project.aspectRatio === '9:16' ? "bg-gold/20 border-gold/50 text-gold" : "hover:bg-white/5")}>9:16</button>
                   <button onClick={() => setProject(p => ({...p, aspectRatio: '1:1'}))} className={cn("px-3 py-1 rounded-md text-[10px] font-bold border border-white/10 transition-all", project.aspectRatio === '1:1' ? "bg-gold/20 border-gold/50 text-gold" : "hover:bg-white/5")}>1:1</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-black/10">
               {project.layers.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center opacity-20 gap-3">
                    <Layers className="w-12 h-12" />
                    <p className="text-xs font-bold uppercase tracking-widest text-gold text-center">لا توجد طبقات بعد</p>
                 </div>
               ) : (
                 <div className="p-2 space-y-1">
                   {project.layers.map((layer) => (
                     <div 
                      key={layer.id} 
                      className={cn(
                        "group flex items-center h-10 gap-2 px-3 rounded-lg transition-all",
                        activeLayerId === layer.id ? "bg-gold/10 shadow-sm border border-gold/20" : "hover:bg-white/5"
                      )}
                      onClick={() => setActiveLayerId(layer.id)}
                     >
                       <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center shrink-0">
                          {layer.type === 'image' && <ImageIcon className="w-3 h-3 text-gold" />}
                          {layer.type === 'video' && <Video className="w-3 h-3 text-gold" />}
                          {layer.type === 'text' && <TypeIcon className="w-3 h-3 text-gold" />}
                       </div>
                       <span className="text-xs font-bold flex-1 truncate">{layer.name}</span>
                       <div className="relative flex-1 max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 bg-gold/60 rounded-full"
                            style={{ 
                              left: `${(layer.startTime / project.duration) * 100}%`,
                              width: `${(layer.duration / project.duration) * 100}%`
                            }}
                          />
                       </div>
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1 hover:text-gold"><RotateCcw className="w-3 h-3" /></button>
                         <button className="p-1 hover:text-red-500" onClick={(e) => {
                           e.stopPropagation();
                           setProject(p => ({ ...p, layers: p.layers.filter(l => l.id !== layer.id) }));
                         }}><Trash2 className="w-3 h-3" /></button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-80 border border-white/10 flex flex-col glass z-40 p-6 overflow-y-auto rounded-2xl shadow-xl custom-scrollbar">
          {activeLayer ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-white">إعدادات العنصر</h3>
                   <div className="px-2 py-0.5 rounded bg-gold/10 text-gold text-[10px] font-bold uppercase border border-gold/20 shadow-sm">نشط</div>
                </div>

                {activeLayer.type === 'text' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">محتوى النص</label>
                      <textarea 
                        value={activeLayer.text}
                        onChange={(e) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, text: e.target.value } : l) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-gold/50 min-h-[80px] resize-none"
                        dir="rtl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">نوع الخط</label>
                      <select 
                        value={activeLayer.fontFamily}
                        onChange={(e) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, fontFamily: e.target.value } : l) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-gold/50"
                      >
                        <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic (Default)</option>
                        {customFonts.map(f => <option key={f.family} value={f.family}>{f.family}</option>)}
                      </select>
                    </div>
                    <PropertySlider 
                      label="حجم الخط" 
                      icon={TypeIcon} 
                      value={activeLayer.fontSize || 40} 
                      min={10} 
                      max={200} 
                      onChange={(val) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, fontSize: val } : l) }))}
                    />
                  </div>
                )}

                {activeLayer.type === 'video' && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">تحليل الفيديو</label>
                    <button 
                      onClick={() => handleVideoAnalysis(activeLayer)}
                      disabled={isAnalyzing}
                      className="w-full py-3 glass hover:bg-gold/5 border-gold/20 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all text-gold accent-glow"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          جاري تحليل المشاهد...
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4" />
                          اكتشاف المشاهد ذكياً
                        </>
                      )}
                    </button>

                    {activeLayer.scenes && activeLayer.scenes.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">المشاهد المكتشفة ({activeLayer.scenes.length})</label>
                        <div className="grid gap-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                          {activeLayer.scenes.map((scene, idx) => (
                            <button 
                              key={idx}
                              onClick={() => setCurrentTime(activeLayer.startTime + scene.startTime)}
                              className="p-3 glass hover:bg-white/5 border-white/10 rounded-xl text-right group transition-all relative overflow-hidden"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-mono text-gold font-bold">{scene.startTime.toFixed(1)}s - {scene.endTime.toFixed(1)}s</span>
                                <span className="text-[10px] text-white/30 font-bold"># {idx + 1}</span>
                              </div>
                              <p className="text-[11px] font-bold text-white/70 line-clamp-2 leading-relaxed">{scene.description}</p>
                              <div className="absolute bottom-0 right-0 w-1 h-full bg-gold/20 group-hover:bg-gold transition-colors" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <PropertySlider 
                    label="المقياس" 
                    icon={Maximize2} 
                    value={activeLayer.scale} 
                    min={0.1} 
                    max={5} 
                    step={0.1}
                    onChange={(val) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, scale: val } : l) }))}
                  />
                  <PropertySlider 
                    label="الدوران" 
                    icon={RotateCcw} 
                    value={activeLayer.rotation} 
                    min={-180} 
                    max={180} 
                    onChange={(val) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, rotation: val } : l) }))}
                  />
                  <PropertySlider 
                    label="الشفافية" 
                    icon={Eye} 
                    value={activeLayer.opacity} 
                    min={0} 
                    max={1} 
                    step={0.01}
                    onChange={(val) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, opacity: val } : l) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  التوقيت والحركة
                </h3>
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-white/30 font-bold mb-1">وقت البدء</p>
                      <input 
                        type="number" 
                        value={activeLayer.startTime}
                        className="bg-transparent text-sm font-bold focus:outline-none w-full"
                        onChange={(e) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, startTime: parseFloat(e.target.value) || 0 } : l) }))}
                      />
                   </div>
                   <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-[10px] text-white/30 font-bold mb-1">المدة</p>
                      <input 
                        type="number" 
                        value={activeLayer.duration}
                        className="bg-transparent text-sm font-bold focus:outline-none w-full"
                        onChange={(e) => setProject(p => ({ ...p, layers: p.layers.map(l => l.id === activeLayer.id ? { ...l, duration: parseFloat(e.target.value) || 0 } : l) }))}
                      />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">تأثيرات نشطة</h3>
                <div className="space-y-2">
                  {activeLayer.effects.length === 0 ? (
                    <div className="p-8 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center opacity-30 gap-2">
                       <Zap className="w-5 h-5 text-gold" />
                       <p className="text-[10px] font-bold">لا توجد تأثيرات</p>
                    </div>
                  ) : (
                    activeLayer.effects.map((fx, idx) => (
                      <div key={idx} className="p-3 bg-gold/5 border border-gold/20 rounded-xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="p-2 bg-gold/20 rounded-lg text-gold"><Zap className="w-3 h-3" /></div>
                           <span className="text-xs font-bold capitalize">{fx.type}</span>
                         </div>
                         <button className="text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-20">
               <div className="w-16 h-16 rounded-3xl bg-white/10 flex items-center justify-center">
                 <CursorIcon className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-sm font-bold">لم يتم اختيار عنصر</h3>
                 <p className="text-xs font-medium leading-relaxed">حدد طبقة من الخط الزمني أو اضغط على عنصر في لوحة المعاينة لبدء التعديل.</p>
               </div>
             </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function PropertySlider({ label, icon: Icon, value, min, max, step = 1, onChange }: { 
  label: string; 
  icon: any; 
  value: number; 
  min: number; 
  max: number; 
  step?: number;
  onChange: (val: number) => void; 
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/50">
          <Icon className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-xs font-mono font-bold text-gold">{value.toFixed(step >= 1 ? 0 : 2)}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-gold"
      />
    </div>
  );
}

function CursorIcon(props: any) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
      <path d="m13 13 6 6" />
    </svg>
  );
}
