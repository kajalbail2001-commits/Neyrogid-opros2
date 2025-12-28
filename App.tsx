
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Check, 
  ChevronRight,
  Sparkles,
  BarChart3,
  X,
  Users,
  Trophy,
  MousePointer2,
  RefreshCcw,
  Globe2,
  MessageCircle,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { UserAnswers, SurveyStage } from './types';
import { OPTIONS } from './constants';

// --- CONFIGURATION ---
// ВСТАВЬ СЮДА ССЫЛКУ ИЗ GOOGLE APPS SCRIPT (Web App URL)
// Пример: "https://script.google.com/macros/s/AKfycbx.../exec"
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbybd1-NBytNbN7JFb8XuCXSPycz2CWpuq2MlSqkg9vHWp4NM5-l1UZxs9u-DWEY2-Ws/exec"; 

const STORAGE_KEY = 'neuroguide_all_results';
const AVATAR_URL = "https://i.imgur.com/BhNSFSq.gif";
const FALLBACK_AVATAR = "https://randomuser.me/api/portraits/women/63.jpg";

// Генератор фейковых данных (fallback, если нет интернета или скрипта)
const generateMockData = (): UserAnswers[] => {
  const data: UserAnswers[] = [];
  const randomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)].id;
  const randomItems = (arr: any[], max: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * max) + 1).map(i => i.id);
  };

  for (let i = 0; i < 50; i++) {
    const isSuno = Math.random() > 0.6;
    data.push({
      nickname: `User${i}`,
      role: randomItem(OPTIONS.role) as any,
      goals: randomItems(OPTIONS.goals, 2) as any,
      preferredContent: randomItems(OPTIONS.content, 2) as any,
      tools: randomItems(OPTIONS.tools, 3) as any,
      sunoReason: !isSuno ? (randomItem(OPTIONS.suno) as any) : null,
      motivation: randomItem(OPTIONS.motivation) as any,
      formats: randomItems(OPTIONS.formats, 2) as any,
      courses: randomItems(OPTIONS.courses, 2) as any,
      idealChannel: 'Demo answer',
      isSunoUser: isSuno,
    });
  }
  return data;
};

// Helper: Get readable label from ID
const getLabel = (category: keyof typeof OPTIONS, id: string | null) => {
    if (!id) return '';
    // @ts-ignore
    const option = OPTIONS[category]?.find((o: any) => o.id === id);
    return option ? option.label : id;
};

const App: React.FC = () => {
  const [stage, setStage] = useState<SurveyStage>(SurveyStage.Intro);
  const [isTyping, setIsTyping] = useState(false);
  const [showStats, setShowStats] = useState(false);
  
  // Real Data State
  const [communityData, setCommunityData] = useState<any[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(false);

  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [answers, setAnswers] = useState<UserAnswers>({
    nickname: '',
    role: null,
    goals: [],
    preferredContent: [],
    tools: [],
    sunoReason: null,
    motivation: null,
    formats: [],
    courses: [],
    idealChannel: '',
    isSunoUser: false,
  });
  const [textInput, setTextInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load local results
  const getAllResults = useCallback((): UserAnswers[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }, []);

  // --- TELEGRAM INIT LOGIC ---
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe?.user;
      if (user) {
        const displayName = user.username ? `@${user.username}` : user.first_name;
        
        const existingResults = getAllResults();
        const found = existingResults.find(u => u.telegramId === user.id);
        
        if (found) {
            setIsReturningUser(true);
        }

        setAnswers(prev => ({
            ...prev,
            nickname: displayName,
            telegramId: user.id,
            telegramUsername: user.username
        }));
        setTextInput(displayName);
      }
    }
  }, [getAllResults]);

  // Fetch Community Stats from Google Sheets
  const fetchRealStats = async () => {
    if (!GOOGLE_SCRIPT_URL) {
      console.warn("Google Script URL is missing. Using mock data.");
      setCommunityData(generateMockData());
      return;
    }

    setIsLoadingStats(true);
    setStatsError(false);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setCommunityData(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStatsError(true);
      setCommunityData(generateMockData()); // Fallback
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Submit Data to Google Sheets (Converted to Readable Russian)
  const submitToGoogleSheets = async (finalData: UserAnswers) => {
    if (!GOOGLE_SCRIPT_URL) return;

    // Convert IDs to Labels for Google Sheets
    const payload = {
      ...finalData,
      role: getLabel('role', finalData.role as string),
      goals: finalData.goals.map(id => getLabel('goals', id)),
      preferredContent: finalData.preferredContent.map(id => getLabel('content', id)),
      tools: finalData.tools.map(id => getLabel('tools', id)),
      sunoReason: finalData.isSunoUser ? 'Пользуется Suno/Udio' : getLabel('suno', finalData.sunoReason as string),
      motivation: getLabel('motivation', finalData.motivation as string),
      formats: finalData.formats.map(id => getLabel('formats', id)),
      courses: finalData.courses.map(id => getLabel('courses', id)),
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log("Data sent to Google Sheets (Readable Format)");
    } catch (error) {
      console.error("Error sending to Google Sheets:", error);
    }
  };

  // Load stats when stats modal opens
  useEffect(() => {
    if (showStats) {
      fetchRealStats();
    }
  }, [showStats]);

  // Auto-scroll logic
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
    const timeout = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timeout);
  }, [stage, isTyping, answers]);

  // Focus input
  useEffect(() => {
    if (!isTyping) {
      setTimeout(() => {
        if (stage === SurveyStage.Intro) inputRef.current?.focus();
        if (stage === SurveyStage.IdealChannel) textareaRef.current?.focus();
      }, 300);
    }
  }, [stage, isTyping]);

  // Save result locally + Trigger Remote Save
  const saveResult = useCallback(async (newResult: UserAnswers) => {
    // 1. Local Storage Logic (Store RAW answers with IDs for app logic)
    const existing = getAllResults();
    const index = existing.findIndex(u => {
        if (newResult.telegramId && u.telegramId === newResult.telegramId) return true;
        if (!newResult.telegramId && u.nickname === newResult.nickname) return true;
        return false;
    });

    let updated;
    if (index !== -1) {
        updated = [...existing];
        updated[index] = newResult;
    } else {
        updated = [...existing, newResult];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // 2. Remote Google Sheets Logic (Sends READABLE labels)
    setIsSubmitting(true);
    await submitToGoogleSheets(newResult);
    setIsSubmitting(false);
    
  }, [getAllResults]);

  // Send Data to Telegram Bot (Close App)
  const sendDataToBot = () => {
    if (window.Telegram?.WebApp?.sendData) {
        // Prepare readable text for the bot too
        const readableData = {
           ...answers,
           role: getLabel('role', answers.role as string),
           courses: answers.courses.map(c => getLabel('courses', c)),
           // ... others can be mapped similarly if needed for the bot text
        };
        const dataToSend = JSON.stringify(readableData);
        window.Telegram.WebApp.sendData(dataToSend);
    } else {
        alert("В Telegram это действие закроет приложение и отправит данные боту.");
    }
  };

  // Calculate Stats
  const stats = useMemo(() => {
    const dataToAnalyze = communityData.length > 0 ? communityData : generateMockData();
    
    if (dataToAnalyze.length === 0) return null;

    // Normalizer: Converts Russian Labels back to English IDs for counting, 
    // or keeps English IDs if they exist.
    const normalize = (category: keyof typeof OPTIONS, val: string) => {
        if (!val) return 'unknown';
        // Check if it's already an ID
        // @ts-ignore
        const isId = OPTIONS[category].some((o: any) => o.id === val);
        if (isId) return val;

        // Check if it's a label
        // @ts-ignore
        const match = OPTIONS[category].find((o: any) => o.label === val);
        return match ? match.id : val; // Return ID if found, else original (fallback)
    };

    const countBy = (arr: any[], key: string, category?: keyof typeof OPTIONS) => {
      return arr.reduce((acc, curr) => {
        const val = curr[key];
        if (Array.isArray(val)) {
          val.forEach(v => {
            const normalized = category ? normalize(category, v) : v;
            acc[normalized] = (acc[normalized] || 0) + 1;
          });
        } else if (val) {
          const normalized = category ? normalize(category, val) : val;
          acc[normalized] = (acc[normalized] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
    };

    return {
      total: dataToAnalyze.length,
      roles: countBy(dataToAnalyze, 'role', 'role'),
      tools: countBy(dataToAnalyze, 'tools', 'tools'),
      goals: countBy(dataToAnalyze, 'goals', 'goals'),
      courses: countBy(dataToAnalyze, 'courses', 'courses'),
    };
  }, [communityData]);

  // ... (Transition logic functions stay the same) ...
  const goToNextStage = (nextStage: SurveyStage) => {
    setIsTyping(true);
    setTimeout(() => {
      setStage(nextStage);
      setIsTyping(false);
    }, 800);
  };

  const handleNext = async () => {
    if (stage === SurveyStage.Intro && !textInput.trim()) return;
    
    if (stage === SurveyStage.Intro) {
      setAnswers(prev => ({ ...prev, nickname: textInput }));
      setTextInput('');
      goToNextStage(SurveyStage.RoleSelection);
    } else if (stage === SurveyStage.ToolsUsage) {
      const isSuno = answers.tools.includes('music');
      setAnswers(prev => ({ ...prev, isSunoUser: isSuno }));
      goToNextStage(SurveyStage.SunoLogic);
    } else if (stage === SurveyStage.SunoLogic) {
      goToNextStage(SurveyStage.Motivation);
    } else if (stage === SurveyStage.IdealChannel) {
      const finalAnswers = { ...answers, idealChannel: textInput };
      setAnswers(finalAnswers);
      saveResult(finalAnswers); 
      goToNextStage(SurveyStage.Final);
    } else {
      goToNextStage(stage + 1);
    }
  };

  const selectOption = (key: keyof UserAnswers, value: any, multi: boolean = false, max: number = 99) => {
    setAnswers(prev => {
      if (!multi) return { ...prev, [key]: value };
      const current = (prev[key] as any[]) || [];
      if (current.includes(value)) return { ...prev, [key]: current.filter(v => v !== value) };
      if (current.length >= max) return prev;
      return { ...prev, [key]: [...current, value] };
    });
  };

  const copyToClipboard = () => {
    // Copy readable text
    const readableProfile = {
       "Имя": answers.nickname,
       "Роль": getLabel('role', answers.role as string),
       "Цели": answers.goals.map(g => getLabel('goals', g)).join(', '),
       "Инструменты": answers.tools.map(t => getLabel('tools', t)).join(', '),
       "Курсы": answers.courses.map(c => getLabel('courses', c)).join(', '),
       "Идея канала": answers.idealChannel
    };
    navigator.clipboard.writeText(JSON.stringify(readableProfile, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const restartSurvey = () => {
    setStage(SurveyStage.Intro);
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
    const initialNick = tgUser ? (tgUser.username ? `@${tgUser.username}` : tgUser.first_name) : '';

    setAnswers({
      nickname: initialNick,
      role: null,
      goals: [],
      preferredContent: [],
      tools: [],
      sunoReason: null,
      motivation: null,
      formats: [],
      courses: [],
      idealChannel: '',
      isSunoUser: false,
      telegramId: tgUser?.id,
      telegramUsername: tgUser?.username
    });
    setTextInput(initialNick);
    setShowStats(false);
  };

  // --- RENDERERS ---

  const renderIntro = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <YuliaMessage>
        {isReturningUser ? (
            <span>
                С возвращением, <b>{answers.nickname}</b>! 👋
                <br /><br />
                Вижу, ты уже проходил опрос. Если хочешь изменить ответы — смело продолжай. Я обновлю твой профиль в статистике! 🔄
            </span>
        ) : (
            <span>
                Привет! 🌸 Я Миси, админ канала «НейроГид». Рада тебя видеть! 
                <br /><br />
                Это не скучный тест, а наш диалог. Ответы помогут сделать контент огненным именно для тебя. ✨
                <br /><br />
                Как мне к тебе обращаться?
            </span>
        )}
      </YuliaMessage>
      <div className="relative group">
        <input 
          ref={inputRef}
          type="text" 
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="@username или имя"
          className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-slate-700 placeholder-slate-400"
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          autoFocus 
        />
        <button 
          onClick={handleNext}
          disabled={!textInput.trim()}
          className="absolute right-2 top-2 p-3 bg-emerald-400 hover:bg-emerald-500 disabled:bg-slate-300 text-white rounded-xl transition-all shadow-lg shadow-emerald-200/50"
        >
          <Send size={20} />
        </button>
      </div>
    </motion.div>
  );

  const renderRole = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Приятно познакомиться, {answers.nickname}! ✨
        <br /><br />
        Расскажи немного о себе: кто ты в профессиональном плане?
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.role.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.role === opt.id} 
            onClick={() => {
              selectOption('role', opt.id);
              setTimeout(() => goToNextStage(SurveyStage.Goals), 300);
            }}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
    </motion.div>
  );

  const renderGoals = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Поняла! 🦾 А какая твоя главная цель пребывания в «НейроГиде»? (Можно несколько)
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.goals.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.goals.includes(opt.id as any)} 
            onClick={() => selectOption('goals', opt.id, true)}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      <NextButton onClick={handleNext} disabled={answers.goals.length === 0} />
    </motion.div>
  );

  const renderContent = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Отлично! А какой формат постов тебе заходит лучше всего? 
        <br />
        <span className="text-sm opacity-70">Выбери до 3-х вариантов.</span>
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.content.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.preferredContent.includes(opt.id as any)} 
            onClick={() => selectOption('preferredContent', opt.id, true, 3)}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      <NextButton onClick={handleNext} disabled={answers.preferredContent.length === 0} />
    </motion.div>
  );

  const renderTools = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Интересно... 🤔 А какими инструментами ты уже пользуешься?
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.tools.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.tools.includes(opt.id as any)} 
            onClick={() => selectOption('tools', opt.id, true)}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      <NextButton onClick={handleNext} disabled={answers.tools.length === 0} />
    </motion.div>
  );

  const renderSunoLogic = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      {answers.isSunoUser ? (
        <div className="space-y-6">
          <YuliaMessage>
            О, круто, значит ты в теме AI-музыки! 🎵 Suno и Udio сейчас просто разрывают. 🦋
          </YuliaMessage>
          <div className="flex justify-center">
             <button 
              onClick={handleNext}
              className="px-8 py-4 bg-emerald-400 text-white rounded-2xl font-medium shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
            >
              Идём дальше <ChevronRight size={20}/>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <YuliaMessage>
            Заметила, ты не используешь AI-музыку. Почему? 🎶 Это сейчас один из самых горячих трендов!
          </YuliaMessage>
          <div className="grid grid-cols-1 gap-3">
            {OPTIONS.suno.map(opt => (
              <OptionButton 
                key={opt.id} 
                selected={answers.sunoReason === opt.id} 
                onClick={() => {
                  selectOption('sunoReason', opt.id);
                  setTimeout(() => goToNextStage(SurveyStage.Motivation), 300);
                }}
              >
                {opt.label}
              </OptionButton>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderMotivation = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        А теперь про мотивацию. Для чего тебе всё это в конечном итоге? 🦋
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.motivation.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.motivation === opt.id} 
            onClick={() => {
              selectOption('motivation', opt.id);
              setTimeout(() => goToNextStage(SurveyStage.FormatPreference), 300);
            }}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
    </motion.div>
  );

  const renderFormats = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Поняла. В каком виде тебе удобнее потреблять информацию в Телеграме? 📱
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.formats.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.formats.includes(opt.id as any)} 
            onClick={() => selectOption('formats', opt.id, true)}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      <NextButton onClick={handleNext} disabled={answers.formats.length === 0} />
    </motion.div>
  );

  const renderCourses = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <YuliaMessage>
        Круто! 🔥 Я сейчас планирую обучающие материалы.
        <br /><br />
        Курсы по какому продукту в нейросетях ты бы хотел пройти? (Можно несколько) 🎓
      </YuliaMessage>
      <div className="grid grid-cols-1 gap-3">
        {OPTIONS.courses.map(opt => (
          <OptionButton 
            key={opt.id} 
            selected={answers.courses.includes(opt.id as any)} 
            onClick={() => selectOption('courses', opt.id, true)}
            icon={opt.icon}
          >
            {opt.label}
          </OptionButton>
        ))}
      </div>
      <NextButton onClick={handleNext} disabled={answers.courses.length === 0} />
    </motion.div>
  );

  const renderIdealChannel = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
      <YuliaMessage>
        И последний штрих! 🎨
        <br /><br />
        Одной фразой: если бы канал стал идеальным лично для тебя — о чём бы он был?
      </YuliaMessage>
      <div className="relative">
        <textarea 
          ref={textareaRef}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder="Твои мысли здесь..."
          className="w-full px-6 py-4 rounded-2xl bg-white/60 border border-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-200 transition-all text-slate-700 min-h-[120px] resize-none placeholder-slate-400"
          autoFocus
        />
        <div className="flex justify-end mt-4">
          <button 
            onClick={handleNext}
            className="px-8 py-4 bg-emerald-400 text-white rounded-2xl font-medium shadow-xl shadow-emerald-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            Завершить <ChevronRight size={20}/>
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderFinal = () => {
    // Construct Readable Profile for display
    const readableProfile = {
       "Имя": answers.nickname,
       "Роль": getLabel('role', answers.role as string),
       "Цели": answers.goals.map(g => getLabel('goals', g)),
       "Контент": answers.preferredContent.map(c => getLabel('content', c)),
       "Инструменты": answers.tools.map(t => getLabel('tools', t)),
       "Курсы": answers.courses.map(c => getLabel('courses', c)),
    };

    return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
        <Check className="text-emerald-500" size={40} />
      </div>
      <YuliaMessage align="center">
        Спасибо тебе огромное! ❤️ 
        <br /><br />
        Твои ответы сохранены в системе и помогут мне развивать канал. Теперь мы точно на одной волне! 🌊
      </YuliaMessage>
      
      {isSubmitting && (
         <div className="flex justify-center items-center gap-2 text-emerald-600 text-sm font-medium animate-pulse">
            <Loader2 className="animate-spin" size={16}/> Сохраняем ответы...
         </div>
      )}

      <div className="bg-white/40 rounded-2xl p-4 border border-white/60 text-left overflow-hidden relative group">
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-bold flex items-center justify-between">
            Твой цифровой профиль:
            <span className="text-emerald-500/60 text-[9px] lowercase">json preview</span>
        </p>
        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap max-h-40 overflow-auto custom-scrollbar">
          {JSON.stringify(readableProfile, null, 2)}
        </pre>
      </div>

      <div className="space-y-3">
         {/* SEND TO BOT BUTTON */}
         <button 
          onClick={sendDataToBot}
          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-300/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 animate-pulse"
        >
          <MessageCircle size={22} className="fill-white/20" />
          Отправить ответы в чат
        </button>

        <button 
          onClick={copyToClipboard}
          className="w-full py-4 bg-white/70 text-slate-600 rounded-2xl font-medium border border-white hover:bg-white transition-all flex items-center justify-center gap-3 group"
        >
          {copied ? <Check size={20} className="text-emerald-500"/> : <Sparkles className="group-hover:rotate-12 transition-transform text-slate-400" size={20} />}
          {copied ? 'Скопировано!' : 'Скопировать профиль'}
        </button>
      </div>
    </motion.div>
  )};

  const TypingIndicator = () => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-2 p-4 bg-white/60 rounded-2xl w-fit mb-4 border border-white/40 shadow-sm"
    >
      <span className="flex gap-1">
        <motion.span 
          animate={{ y: [0, -5, 0] }} 
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
        <motion.span 
          animate={{ y: [0, -5, 0] }} 
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
        <motion.span 
          animate={{ y: [0, -5, 0] }} 
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
      </span>
      <span className="text-xs text-slate-400 font-medium ml-2">Миси печатает...</span>
    </motion.div>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-[#FFFDF7] via-[#F3E8FF] to-[#D1FAE5] flex items-center justify-center p-0 sm:p-4 relative overflow-hidden">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Background Animated Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100/20 blur-[100px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-100/20 blur-[120px] rounded-full animate-pulse delay-700" />
      
      {/* Main Container - Full Height on Mobile */}
      <main className="w-full sm:max-w-lg relative z-10 h-[100dvh] sm:h-[85dvh] flex flex-col sm:rounded-[2.5rem] bg-white/20 sm:bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 sm:px-2 sm:mb-6 shrink-0">
          <div className="flex items-center gap-4">
            {/* Styled Avatar Circle */}
            <div className="relative group cursor-pointer">
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ repeat: Infinity, duration: 4 }}
                className="absolute inset-0 bg-emerald-400/30 blur-md rounded-full group-hover:bg-emerald-400/50 transition-colors"
              />
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-emerald-400 via-white to-pink-300 shadow-xl overflow-hidden border border-white/80">
                <img 
                  src={AVATAR_URL}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== FALLBACK_AVATAR) target.src = FALLBACK_AVATAR;
                  }}
                  alt="Misi Avatar" 
                  className="w-full h-full object-cover rounded-full bg-white" 
                />
              </div>
              {/* Pulsing online status */}
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
            </div>
            
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                Миси <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">online</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Админ «НейроГид»</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowStats(true)}
            className="p-3 bg-white/60 hover:bg-white/80 border border-white/40 rounded-2xl text-slate-600 transition-all shadow-sm active:scale-90"
            title="Общая статистика"
          >
            <BarChart3 size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div 
            ref={chatContainerRef}
            className="flex-1 glass-panel sm:rounded-[2.5rem] rounded-t-[2.5rem] p-4 sm:p-6 shadow-2xl overflow-y-auto custom-scrollbar relative flex flex-col border-x-0 border-b-0 sm:border border-white/60 bg-white/30 backdrop-blur-xl"
        >
          <AnimatePresence mode="wait">
            {isTyping ? (
              <div key="typing" className="flex-1 flex flex-col justify-end pb-4">
                 <TypingIndicator />
              </div>
            ) : (
              <div key={stage} className="flex-1 pb-4">
                {stage === SurveyStage.Intro && renderIntro()}
                {stage === SurveyStage.RoleSelection && renderRole()}
                {stage === SurveyStage.Goals && renderGoals()}
                {stage === SurveyStage.ContentPreference && renderContent()}
                {stage === SurveyStage.ToolsUsage && renderTools()}
                {stage === SurveyStage.SunoLogic && renderSunoLogic()}
                {stage === SurveyStage.Motivation && renderMotivation()}
                {stage === SurveyStage.FormatPreference && renderFormats()}
                {stage === SurveyStage.Courses && renderCourses()}
                {stage === SurveyStage.IdealChannel && renderIdealChannel()}
                {stage === SurveyStage.Final && renderFinal()}
                <div ref={chatEndRef} />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="py-4 px-6 bg-white/30 sm:bg-transparent">
          <div className="h-1.5 w-full bg-white/40 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(stage / (SurveyStage.Final)) * 100}%` }}
              className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.6)]"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-[0.2em] font-bold">
            Этап {Math.min(stage + 1, SurveyStage.Final + 1)} / 11
          </p>
        </div>
      </main>

      {/* Stats Modal */}
      <AnimatePresence>
        {showStats && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/95 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] border border-white"
            >
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="text-emerald-500" /> Статистика
                    </h2>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                      {isLoadingStats ? (
                        <><Loader2 className="animate-spin" size={14}/> Загрузка данных...</>
                      ) : statsError ? (
                        <><Globe2 size={14} className="text-amber-500"/> Демо-режим (ошибка сети)</>
                      ) : GOOGLE_SCRIPT_URL ? (
                        <><Globe2 size={14} className="text-emerald-500"/> Реальные данные сообщества</>
                      ) : (
                         <><Globe2 size={14} className="text-slate-400"/> Демо-данные (нет URL)</>
                      )}
                    </p>
                 </div>
                 <button 
                  onClick={() => setShowStats(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              {!stats ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={48} className="mx-auto mb-4 opacity-20" />
                  <p>Данные загружаются...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider">Всего участников</p>
                      <p className="text-4xl font-black text-emerald-700">{stats.total}</p>
                      <p className="text-[10px] text-emerald-500 font-medium mt-1">Твоих ответов: {localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').length : 0}</p>
                    </div>
                    <Users size={40} className="text-emerald-200" />
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-200/20 rounded-full blur-xl"></div>
                  </div>
                  
                  {!GOOGLE_SCRIPT_URL && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-xs text-amber-600/80 flex gap-2 items-start">
                      <Sparkles size={14} className="shrink-0 mt-0.5"/>
                      <span>Это демонстрационные данные. Добавь ссылку на Google Apps Script, чтобы видеть реальную статистику.</span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <MousePointer2 size={14}/> Роли аудитории
                    </h3>
                    <div className="space-y-4">
                      {OPTIONS.role.map(role => {
                        const count = stats.roles[role.id] || 0;
                        const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={role.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-600">{role.label}</span>
                              <span className="text-emerald-500">{percent}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-emerald-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Trophy size={14}/> Интересы
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {OPTIONS.goals.map(goal => {
                        const count = stats.goals[goal.id] || 0;
                        return (
                          <div key={goal.id} className="bg-white border border-slate-100 p-3 rounded-2xl flex items-center gap-3 shadow-sm">
                            <span className="text-emerald-500 bg-emerald-50 p-2 rounded-xl">{goal.icon}</span>
                            <div>
                              <p className="font-bold text-slate-700 text-sm">{count}</p>
                              <p className="text-[9px] text-slate-400 uppercase font-bold leading-none">{goal.id}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <GraduationCap size={14}/> Обучение
                    </h3>
                    <div className="space-y-4">
                      {OPTIONS.courses.map(course => {
                        const count = stats.courses[course.id] || 0;
                        const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                        return (
                          <div key={course.id} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-600">{course.label}</span>
                              <span className="text-emerald-500">{percent}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className="h-full bg-emerald-400" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <button 
                      onClick={restartSurvey} 
                      className="w-full py-3 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCcw size={16}/> Сбросить и начать заново
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Sub-components
const YuliaMessage: React.FC<{ children: React.ReactNode; align?: 'left' | 'center' }> = ({ children, align = 'left' }) => (
  <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start'} mb-6`}>
    <div className={`max-w-[90%] bg-white p-5 rounded-2xl rounded-tl-none shadow-sm text-slate-700 leading-relaxed text-sm border border-white relative`}>
      <div className="absolute -left-2 top-0 w-4 h-4 bg-white" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 0)' }}></div>
      {children}
    </div>
  </div>
);

const OptionButton: React.FC<{ 
  children: React.ReactNode; 
  selected: boolean; 
  onClick: () => void;
  icon?: React.ReactNode;
}> = ({ children, selected, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
      selected 
      ? 'bg-emerald-400 text-white border-emerald-300 shadow-xl shadow-emerald-200/40 scale-[1.03] z-10' 
      : 'bg-white/60 text-slate-600 border-white/80 hover:bg-white hover:border-white shadow-sm'
    }`}
  >
    {icon && (
      <span className={`p-2 rounded-xl transition-colors ${selected ? 'bg-white/20' : 'bg-slate-50'}`}>
        {icon}
      </span>
    )}
    <span className="font-semibold text-left flex-1">{children}</span>
    {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto"><Check size={20} /></motion.div>}
  </button>
);

const NextButton: React.FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
  <div className="flex justify-end pt-2">
    <button 
      onClick={onClick}
      disabled={disabled}
      className="px-8 py-4 bg-emerald-400 disabled:bg-slate-300 text-white rounded-2xl font-bold shadow-xl shadow-emerald-200/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
    >
      Далее <ChevronRight size={20}/>
    </button>
  </div>
);

export default App;
