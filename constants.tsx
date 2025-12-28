
import { 
  Briefcase, 
  Wrench, 
  Palette, 
  Eye, 
  DollarSign, 
  Bot, 
  Clapperboard, 
  Smile,
  BookOpen,
  Box,
  Zap,
  Music,
  FileText,
  Video,
  ClipboardList,
  MessageSquare,
  Image
} from 'lucide-react';

export const OPTIONS = {
  role: [
    { id: 'business', label: 'Предприниматель / Бизнес', icon: <Briefcase size={18} /> },
    { id: 'freelance', label: 'Фрилансер / Специалист', icon: <Wrench size={18} /> },
    { id: 'creative', label: 'Творческий / Хобби', icon: <Palette size={18} /> },
    { id: 'observer', label: 'Просто наблюдаю', icon: <Eye size={18} /> },
  ],
  goals: [
    { id: 'money', label: 'Идеи для заработка', icon: <DollarSign size={18} /> },
    { id: 'work', label: 'Нейросети для работы', icon: <Bot size={18} /> },
    { id: 'content', label: 'Контент и визуал', icon: <Clapperboard size={18} /> },
    { id: 'fun', label: 'Развлечение и фан', icon: <Smile size={18} /> },
  ],
  content: [
    { id: 'guides', label: 'Пошаговые гайды', icon: <BookOpen size={18} /> },
    { id: 'cases', label: 'Кейсы «Было / Стало»', icon: <Zap size={18} /> },
    { id: 'tools', label: 'Подборки инструментов', icon: <Box size={18} /> },
    { id: 'memes', label: 'Мемы и лёгкий формат', icon: <Smile size={18} /> },
  ],
  tools: [
    { id: 'chatgpt', label: 'ChatGPT / Claude' },
    { id: 'midjourney', label: 'Midjourney / картинки' },
    { id: 'video', label: 'Sora / Veo / видео' },
    { id: 'music', label: 'Suno / Udio (музыка)' },
    { id: 'beginner', label: 'Ничем не пользуюсь' },
  ],
  suno: [
    { id: 'expensive', label: 'Дорого / нет подписки' },
    { id: 'hard', label: 'Сложно / не разбирался' },
    { id: 'not_needed', label: 'Не нужно, я про визуал' },
    { id: 'missed', label: 'Пропустил этот гайд' },
  ],
  motivation: [
    { id: 'earn', label: 'Зарабатывать с помощью AI', icon: <DollarSign size={18} /> },
    { id: 'simplify', label: 'Упрощать свою работу', icon: <Zap size={18} /> },
    { id: 'jokes', label: 'Делать приколы для себя', icon: <Smile size={18} /> },
    { id: 'stay_tuned', label: 'Просто быть в теме', icon: <Eye size={18} /> },
  ],
  formats: [
    { id: 'short', label: 'Короткие посты', icon: <FileText size={18} /> },
    { id: 'long', label: 'Лонгриды', icon: <BookOpen size={18} /> },
    { id: 'video', label: 'Видео / кружочки', icon: <Video size={18} /> },
    { id: 'checklists', label: 'Чек-листы / PDF', icon: <ClipboardList size={18} /> },
  ],
  courses: [
    { id: 'prompting', label: 'Промпт-инжиниринг / Тексты', icon: <MessageSquare size={18} /> },
    { id: 'images', label: 'Генерация изображений', icon: <Image size={18} /> },
    { id: 'video', label: 'Создание AI-видео', icon: <Video size={18} /> },
    { id: 'music', label: 'AI-музыка (Suno/Udio)', icon: <Music size={18} /> },
    { id: 'marketing', label: 'Маркетинг и продажи', icon: <Briefcase size={18} /> },
    { id: 'coding', label: 'Кодинг с нейросетями', icon: <Bot size={18} /> },
  ],
};
