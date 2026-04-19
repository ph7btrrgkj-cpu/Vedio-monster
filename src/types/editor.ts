export type AspectRatio = '9:16' | '16:9' | '1:1';

export type LayerType = 'image' | 'video' | 'text' | 'svg';

export interface MotionEffect {
  id: string;
  type: 'rotation' | 'zoom' | 'slide' | 'shake' | 'fade' | 'glow' | 'particles';
  duration: number;
  delay: number;
  easing: string;
}

export interface Scene {
  id: string;
  startTime: number;
  endTime: number;
  description: string;
  thumbnail?: string;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  url?: string;
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  startTime: number;
  duration: number;
  effects: MotionEffect[];
  scenes?: Scene[];
}

export interface Project {
  id: string;
  name: string;
  aspectRatio: AspectRatio;
  layers: Layer[];
  duration: number;
}
