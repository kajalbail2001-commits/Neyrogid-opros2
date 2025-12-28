
export type Role = 'business' | 'freelance' | 'creative' | 'observer';
export type Goal = 'money' | 'work' | 'content' | 'fun';
export type ContentType = 'guides' | 'cases' | 'tools' | 'memes';
export type Tool = 'chatgpt' | 'midjourney' | 'video' | 'music' | 'beginner';
export type SunoLogic = 'expensive' | 'hard' | 'not_needed' | 'missed' | 'already_user';
export type Motivation = 'earn' | 'simplify' | 'jokes' | 'stay_tuned';
export type Format = 'short' | 'long' | 'video' | 'checklists';
export type CourseTopic = 'prompting' | 'images' | 'video' | 'music' | 'marketing' | 'coding';

export interface UserAnswers {
  nickname: string;
  role: Role | null;
  goals: Goal[];
  preferredContent: ContentType[];
  tools: Tool[];
  sunoReason: SunoLogic | null;
  motivation: Motivation | null;
  formats: Format[];
  courses: CourseTopic[];
  idealChannel: string;
  isSunoUser: boolean;
  telegramId?: number; // Added for TMA
  telegramUsername?: string; // Added for TMA
}

export enum SurveyStage {
  Intro = 0,
  RoleSelection = 1,
  Goals = 2,
  ContentPreference = 3,
  ToolsUsage = 4,
  SunoLogic = 5,
  Motivation = 6,
  FormatPreference = 7,
  Courses = 8,
  IdealChannel = 9,
  Final = 10
}

// Telegram WebApp Types
declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          showProgress: (leaveActive: boolean) => void;
          hideProgress: () => void;
        };
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
        };
        sendData: (data: string) => void;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
      };
    };
  }
}
