// A single key-value pair extracted from the form.
export interface FormField {
  field: string;
  value: string;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FormFillerHistoryItem {
  id: number;
  infoText: string;
  image: string; // base64 data URL representing the document
  result: FormField[];
  timestamp: string;
}

export enum Tone {
  Friendly = 'เป็นกันเอง',
  Professional = 'เป็นมืออาชีพ',
  Humorous = 'ตลกขบขัน',
  Poetic = 'บทกวี',
  Concise = 'กระชับ',
  Inspirational = 'สร้างแรงบันดาลใจ',
  Skeptical = 'ขี้สงสัย',
  Formal = 'เป็นทางการ',
}

export enum Personality {
  Assistant = 'ผู้ช่วย',
  Expert = 'ผู้เชี่ยวชาญ',
  Storyteller = 'นักเล่าเรื่อง',
  Friend = 'เพื่อน',
  Motivator = 'นักสร้างแรงบันดาลใจ',
  Philosopher = 'นักปรัชญา',
  Journalist = 'นักข่าว',
  Comedian = 'นักแสดงตลก',
  Songwriter = 'นักแต่งเพลง',
}

export enum OutputLength {
  Short = 'สั้น',
  Medium = 'ปานกลาง',
  Long = 'ยาว',
}

export enum AspectRatio {
    Square = '1:1',
    Portrait = '3:4',
    Landscape = '4:3',
    Widescreen = '16:9',
    Tall = '9:16',
}

export enum ArtStyle {
    None = 'ไม่มี (ค่าเริ่มต้น)',
    Photorealistic = 'ภาพถ่ายสมจริง',
    Anime = 'อนิเมะ',
    Cyberpunk = 'ไซเบอร์พังค์',
    Steampunk = 'สตีมพังค์',
    Fantasy = 'แฟนตาซี',
    Watercolor = 'ภาพวาดสีน้ำ',
    PixelArt = 'ศิลปะพิกเซล',
    Abstract = 'นามธรรม',
    Cartoon = 'การ์ตูน',
}

export enum DocumentType {
    Resume = 'เรซูเม่',
    CoverLetter = 'จดหมายสมัครงาน',
    BusinessProposal = 'ข้อเสนอทางธุรกิจ',
    Report = 'รายงาน',
    Email = 'อีเมล',
    BlogPost = 'บทความบล็อก',
    SocialMediaPost = 'โพสต์โซเชียลมีเดีย',
    SpeechScript = 'สคริปต์คำปราศรัย',
    MarketingCopy = 'ข้อความโฆษณา',
}

export interface WriterHistoryItem {
  id: number;
  prompt: string;
  tone: Tone;
  personality: Personality;
  outputLength?: OutputLength;
  keywords?: string;
  result: string;
  timestamp: string;
}

export interface DocumentDesignerHistoryItem {
  id: number;
  prompt: string;
  documentType: DocumentType;
  result: string;
  timestamp: string;
}

export interface ImageCaptionerHistoryItem {
  id: number;
  image: string; // base64 data URL
  caption: string;
  timestamp: string;
}

export interface ImageHistoryItem {
    id: number;
    dataUrl: string; // base64 data URL
    prompt: string;
    aspectRatio: AspectRatio;
    artStyle: ArtStyle;
    timestamp: string;
    caption?: string;
    isCaptionLoading?: boolean; // For UI state
}

export interface VideoHistoryItem {
    id: number;
    videoUrl: string; // Blob URL to the video file
    prompt: string;
    imageUrl?: string; // base64 data URL for the input image
    aspectRatio: AspectRatio;
    timestamp: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  content: string;
}