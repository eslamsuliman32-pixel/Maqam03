const fs = require('fs');

let content = fs.readFileSync('src/AFLDashboard.tsx', 'utf8');

const stratBlock = `const AdvancedFlowMonitor = () => {`;
const endBlockIndex = content.indexOf(`// ─── Unit 5`, content.indexOf(stratBlock));

const blockToReplace = content.substring(content.indexOf(stratBlock), endBlockIndex);

const newContent = `const AdvancedFlowMonitor = () => {
  const { flow_sessions, holographic_blueprints, beat_passports } = useAFLStore();
  const session = flow_sessions[0];
  const blueprint = holographic_blueprints.find(bp => bp.id === session?.blueprint_id);
  const passport = beat_passports.find(p => p.id === blueprint?.beat_id);

  const [activeTab, setActiveTab] = useState<'alignment' | 'spectral' | 'breath'>('alignment');
  const [isRecording, setIsRecording] = useState(false);

  if (!session) return (
    <div className="flex flex-col items-center justify-center p-32 space-y-6">
      <div className="w-24 h-24 border-4 border-zinc-900 border-t-amber-500 rounded-full animate-spin" />
      <div className="text-center">
        <h2 className="text-xl font-black text-zinc-100 italic mb-2 uppercase">في انتظار الالتقاط العصبي</h2>
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">قم بتوصيل الواجهة المايكروية لبدء التحليل الجراحي</p>
      </div>
      <button 
        onClick={() => setIsRecording(true)}
        className="px-10 h-14 bg-white text-black font-black uppercase rounded-full hover:bg-amber-500 transition-all flex items-center gap-3 shadow-2xl"
      >
        <Mic2 className="w-5 h-5" />
        بدء الجلسة
      </button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500" id="advanced-flow-monitor">
      {/* ── Top Summary & Live HUD ── */}
      <div className="grid grid-cols-12 gap-6 bg-zinc-950 p-6 rounded-[2rem] border border-zinc-900 shadow-2xl">
         {/* Live HUD Simulation */}
         <div className="col-span-12 lg:col-span-4 p-8 border border-zinc-800 bg-black rounded-3xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-full bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05),transparent)] pointer-events-none" />
            
            <div className="flex justify-between items-start mb-8 z-10 relative">
               <div className="text-[10px] font-black uppercase text-amber-500 tracking-[0.3em] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  HUD مفعّل (اللقطة {session.take_number})
               </div>
               <Activity className="w-4 h-4 text-zinc-600" />
            </div>

            <div className="z-10 relative">
               <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-mono text-zinc-500">بوصلة الجروف (Groove Compass)</span>
                  <span className="text-5xl font-black italic text-zinc-100">{session.groove_index}%</span>
               </div>
               <div className="h-2 bg-zinc-900 rounded-full overflow-hidden mb-6 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: \`\${session.groove_index}%\` }}
                    className={\`h-full \${session.groove_index > 85 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : session.groove_index > 70 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-rose-500'}\`} 
                  />
                  <div className="absolute top-0 bottom-0 left-[85%] w-px bg-white/30" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-zinc-500">الحالة</span>
                     <span className={\`text-[10px] font-bold \${session.groove_index > 85 ? 'text-emerald-400' : 'text-amber-400'}\`}>
                        {session.groove_status.toUpperCase()}
                     </span>
                  </div>
                  <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl flex items-center justify-between">
                     <span className="text-[9px] font-black uppercase text-zinc-500">السيولة (Glide)</span>
                     <span className="text-[10px] font-bold text-blue-400">{session.flow_fluidity_score} PT</span>
                  </div>
               </div>
            </div>
         </div>

         {/* Performance Card */}
         <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 flex flex-col justify-center relative overflow-hidden group">
               <ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 text-zinc-800/20 group-hover:text-amber-500/10 transition-colors" />
               <div className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest relative z-10">الصحة الطيفية (النقاء)</div>
               <div className="text-4xl font-black italic text-amber-500 relative z-10">{session.spectral_health_score}%</div>
               <div className="mt-4 flex gap-1 relative z-10">
                 {Array.from({length: 10}).map((_, i) => (
                   <div key={i} className={\`h-1 flex-1 rounded-full \${i < session.spectral_health_score/10 ? 'bg-amber-500' : 'bg-zinc-800'}\`} />
                 ))}
               </div>
            </div>
            
            <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/50 flex flex-col justify-center relative overflow-hidden group">
               <Wind className="absolute -right-4 -bottom-4 w-32 h-32 text-zinc-800/20 group-hover:text-emerald-500/10 transition-colors" />
               <div className="text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest relative z-10">الاحتياطي التنفسي الأدنى</div>
               <div className="text-4xl font-black italic text-emerald-500 relative z-10">{Math.min(...session.breath_reserve_curve)}%</div>
               <div className="mt-4 text-[10px] text-zinc-400 font-mono relative z-10">لا يوجد انقطاع حيوي</div>
            </div>
            
            <div className="p-6 bg-blue-500/10 rounded-3xl border border-blue-500/20 flex flex-col justify-center relative shadow-[0_0_20px_rgba(59,130,246,0.1)]">
               <div className="text-[9px] font-black uppercase text-blue-400 mb-4 tracking-widest">المعالج الفوري متاح</div>
               <p className="text-xs text-blue-300 font-medium leading-relaxed mb-4">تم اكتشاف 3 كلمات خارج الجيب و 2 مناطق تداخل طيفي.</p>
               <button className="h-10 bg-blue-500 text-black text-[10px] font-black uppercase rounded-xl hover:bg-blue-400 transition-colors">
                 تطبيق الإصلاح السريع
               </button>
            </div>
         </div>
      </div>

      {/* ── Diagnostic Layout ── */}
      <div className="grid grid-cols-12 gap-6">
         {/* Left: View Selector & Canvas */}
         <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden relative min-h-[500px] flex flex-col">
               {/* Header / Tabs */}
               <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-black/40">
                  <div className="flex gap-2">
                     {[
                       { id: 'alignment', label: 'المحاذاة القسرية (Align)', icon: Hash },
                       { id: 'spectral', label: 'التوتر الطيفي (Spectral)', icon: Layers },
                       { id: 'breath', label: 'رئة الفلو (Physiology)', icon: Wind },
                     ].map(tab => (
                       <button 
                         key={tab.id}
                         onClick={() => setActiveTab(tab.id as any)}
                         className={\`px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase transition-all \${
                           activeTab === tab.id ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900'
                         }\`}
                       >
                         <tab.icon className="w-4 h-4" />
                         {tab.label}
                       </button>
                     ))}
                  </div>
               </div>

               <div className="flex-1 relative p-8 flex flex-col">
                  {/* ── View 1: Forced Alignment & Glide ── */}
                  {activeTab === 'alignment' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center">
                       {/* Timeline Representation */}
                       <div className="relative h-48 border-y border-zinc-900 bg-black/20 flex flex-col justify-center px-8">
                          {/* Grid Lines */}
                          <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                             {Array.from({length: 16}).map((_, i) => (
                               <div key={i} className="w-px h-full bg-zinc-700" />
                             ))}
                          </div>
                          
                          {/* Phonemes Bar */}
                          <div className="relative h-16 w-full flex items-center">
                             {session.phoneme_map.map((p, i) => {
                                const isPocket = p.in_pocket;
                                const width = p.end_ms - p.start_ms;
                                return (
                                  <div key={i} className="absolute flex flex-col items-center group cursor-pointer" style={{ left: \`\${(p.start_ms / 3000) * 100}%\`, width: \`\${(width / 3000) * 100}%\` }}>
                                     <div className={\`w-full h-8 rounded border \${isPocket ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-rose-500/20 border-rose-500/50'}\`} />
                                     <span className="text-[10px] font-bold text-zinc-300 mt-2">{p.word}</span>
                                     <span className="text-[8px] font-mono text-zinc-600">{p.phoneme}</span>
                                     
                                     {/* Offset Badge */}
                                     {!isPocket && (
                                       <div className="absolute -top-8 bg-black border border-zinc-800 px-2 py-1 rounded text-[8px] font-mono whitespace-nowrap z-10 shadow-lg hidden group-hover:block text-rose-400">
                                          {p.temporal_offset_ms > 0 ? '+' : ''}{p.temporal_offset_ms}ms
                                       </div>
                                     )}
                                  </div>
                                );
                             })}
                          </div>
                          
                          {/* Target Grid Points */}
                          <div className="absolute bottom-4 left-8 right-8 flex items-center relative h-4">
                             {session.phoneme_map.filter(p => !p.in_pocket).map((p, i) => (
                                <div key={i} className="absolute w-2 h-2 rounded-full border border-amber-500/50 top-1/2 -translate-y-1/2" style={{ left: \`\${(p.nearest_grid_ms / 3000) * 100}%\` }}>
                                   <div className="absolute top-full mt-1 text-[7px] font-mono text-amber-500/50 -translate-x-1/2">Target</div>
                                </div>
                             ))}
                          </div>
                       </div>
                       
                       {/* Diagnostic List */}
                       <div className="mt-8 space-y-4">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-900">تشريح الانحراف الزمني</h4>
                          <div className="grid grid-cols-3 gap-4">
                             {session.worst_3_moments.map((m, i) => (
                                <div key={i} className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                                   <div className="text-3xl font-black italic text-rose-500 mb-2">"{m}"</div>
                                   <div className="text-[10px] font-bold text-rose-400 font-mono mb-1">متأخر بـ 62ms</div>
                                   <p className="text-[9px] text-zinc-400 leading-relaxed">أثر على السيولة (Glide) بنسبة 12%. ينصح بتبكير الهجوم.</p>
                                </div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {/* ── View 2: Spectral Tension Sculpting ── */}
                  {activeTab === 'spectral' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center">
                       <div className="w-full flex-1 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden flex items-center justify-center min-h-[250px]">
                          {/* Mock Spectrogram */}
                          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                          <div className="absolute inset-x-0 h-px bg-zinc-800 top-[60%]" />
                          <div className="absolute inset-x-0 h-px bg-zinc-800 top-[30%]" />
                          
                          {/* Spectral Clashes */}
                          {session.spectral_clashes.map((clash, i) => (
                             <div key={i} className="absolute flex flex-col items-center" style={{ left: \`\${(clash.time_ms / 3000) * 100}%\`, top: \`\${100 - (clash.frequency_hz / 5000) * 100}%\` }}>
                                <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/50 animate-pulse flex items-center justify-center">
                                   <AlertTriangle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div className="bg-black/80 backdrop-blur-md border border-zinc-800 p-2 rounded-lg mt-2 text-center pointer-events-none transform translate-y-2">
                                   <span className="block text-[10px] font-black uppercase text-rose-400 mb-1">Masking Detected</span>
                                   <span className="block text-[8px] font-mono text-zinc-300">Vs {clash.colliding_instrument} ({clash.frequency_hz}Hz)</span>
                                   <span className="block text-[8px] font-mono text-zinc-500">+{clash.intensity_diff_db}dB Overlap</span>
                                </div>
                             </div>
                          ))}
                       </div>
                       
                       <div className="mt-8 flex gap-6">
                          <div className="p-5 bg-zinc-900 border border-zinc-800 rounded-2xl flex-1 flex items-center gap-4">
                             <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/30">
                                <Search className="w-4 h-4 text-amber-500" />
                             </div>
                             <div>
                                <h5 className="text-xs font-bold text-white mb-1">المعجم الذهبي ينصح:</h5>
                                <p className="text-[10px] text-zinc-400 mr-1">استبدال "سريع" بـ "عنيف" لتجنب إخفاء الصوامت الصفيرية مع السنير المرتفع.</p>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  {/* ── View 3: Breath Physiology ── */}
                  {activeTab === 'breath' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center">
                       <div className="relative h-64 border-b border-zinc-900 flex items-end pb-8">
                          <div className="absolute inset-0 flex flex-col justify-between py-8 opacity-20 pointer-events-none">
                             <div className="border-t border-dashed border-rose-500" />
                             <div className="border-t border-dashed border-amber-500" />
                             <div className="border-t border-dashed border-emerald-500" />
                          </div>
                          
                          <svg className="w-full h-full overflow-visible preserve-3d">
                             <path 
                               d={\`M 0 100 \${session.breath_reserve_curve.map((v, i) => \`L \${(i / (session.breath_reserve_curve.length - 1)) * 100}% \${100 - v}%\`).join(' ')}\`}
                               fill="none"
                               stroke="#3b82f6"
                               strokeWidth="3"
                               className="drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                             />
                             {/* Choke Warning Zone */}
                             <rect x="70%" y="85%" width="10%" height="30%" fill="rgba(244,63,94,0.1)" />
                             {session.breath_critical_points?.map((pt, i) => (
                                <circle key={i} cx={\`\${(pt / session.breath_reserve_curve.length) * 100}%\`} cy={\`\${100 - session.breath_reserve_curve[pt]}%\`} r="4" fill="#f43f5e" className="animate-ping" />
                             ))}
                          </svg>

                          <div className="absolute bottom-0 right-0 p-3 flex gap-4 text-[9px] font-mono text-zinc-500">
                             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full" /> الاحتياطي الكلي (ml)</span>
                             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" /> نقاط الخطر</span>
                          </div>
                       </div>

                       <div className="mt-8 flex gap-4">
                          <div className="flex-1 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-5 rounded-2xl flex flex-col justify-center">
                             <span className="text-[10px] font-black uppercase text-emerald-500 mb-2 tracking-widest">توصية المحاكاة</span>
                             <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                                معدل تدفق الهواء ممتاز. يُقترح وضع "علامة تنفس" (Breath Marker) قبل الكلمة السابعة لتجنب انهيار الرئة في الربع الأخير.
                             </p>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </div>
            </div>
         </div>

         {/* Right: AI Studio Assistant Timeline */}
         <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
            <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 flex-1 flex flex-col">
               <div className="flex items-center gap-3 mb-6 pb-6 border-b border-zinc-900">
                  <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                     <Brain className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                     <h3 className="text-xs font-black text-white uppercase tracking-widest">المساعد الجراحي الحي</h3>
                     <p className="text-[9px] text-zinc-500 font-mono">سجل الأوامر والمقترحات</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {[
                    { type: 'warning', text: 'تم رصد إزاحة زمنية متأخرة بمقدار 45ms في الضربة القوية للبار الثاني.', time: '00:03' },
                    { type: 'info', text: 'تمت المحاذاة القسرية بنجاح للكلمات المفتاحية.', time: '00:08' },
                    { type: 'suggestion', text: 'معجمك الذهبي يحتوي على مرادفات أفضل للهروب من تصادم السنير.', time: '00:12', action: 'عرض المعجم' },
                    { type: 'success', text: 'مؤشر الجروف استقر فوق 85% في هذا البار.', time: '00:18' }
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4">
                       <div className="flex flex-col items-center">
                          <div className={\`w-2 h-2 rounded-full mt-1.5 \${
                            log.type === 'warning' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                            log.type === 'suggestion' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                            log.type === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]' :
                            'bg-blue-500'
                          }\`} />
                          {i !== 3 && <div className="w-px flex-1 bg-zinc-800 my-1" />}
                       </div>
                       <div className="pb-4">
                          <div className="text-[10px] text-zinc-600 font-mono mb-1">{log.time}</div>
                          <p className="text-[11px] text-zinc-300 font-medium leading-relaxed mb-2">{log.text}</p>
                          {log.action && (
                            <button className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 hover:bg-amber-500/20 transition-colors">
                               {log.action}
                            </button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
               
               <div className="mt-6 pt-6 border-t border-zinc-900">
                  <button className="w-full h-12 bg-zinc-900 text-zinc-400 text-xs font-black uppercase rounded-2xl hover:text-white hover:bg-zinc-800 transition-colors border border-zinc-800">
                     توليد ملف الفلو المُحسن (Glided)
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
`;

content = content.replace(blockToReplace, newContent);
fs.writeFileSync('src/AFLDashboard.tsx', content);

console.log("Updated flow monitor");
