export type MasteryLevel = 'none' | 'partial' | 'mastered';

export type MindMapNodeKind = 'root' | 'branch';

export interface TopicMasteryStats {
  correct: number;
  total: number;
}

export interface MindMapNode {
  id: string;
  kind: MindMapNodeKind;
  label: string;
  questionCount: number;
  questionIds: string[];
  children: MindMapNode[];
  mastery: MasteryLevel;
}

export interface MindMapQuestionInput {
  id: string;
  topic?: string | null;
  subtopic?: string | null;
}

export interface BuildMindMapTreeInput {
  rootId: string;
  rootLabel: string;
  questions: MindMapQuestionInput[];
}

export interface TopicMasteryAggregate {
  correct: number;
  total: number;
  percentage: number;
  level: MasteryLevel;
}

export interface PracticedSetMetadata {
  code: string;
  name: string | null;
  subject: string | null;
  examDate?: string | null;
  difficulty?: string | null;
  grade: string | null;
  practicedAt: number | null;
}

export interface PracticedSetDropdownItem {
  code: string;
  label: string;
  subject: string | null;
  examDate?: string | null;
  difficulty?: string | null;
  grade: string | null;
  practicedAt: number | null;
}

export interface MindMapLayoutNode {
  id: string;
  parentId: string | null;
  kind: MindMapNodeKind;
  label: string;
  questionCount: number;
  mastery: MasteryLevel;
  depth: number;
  angle: number;
  radius: number;
  x: number;
  y: number;
}

export interface MindMapLayoutEdge {
  id: string;
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MindMapLayout {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  nodes: MindMapLayoutNode[];
  edges: MindMapLayoutEdge[];
}

export interface MindMapLayoutOptions {
  width?: number;
  height?: number;
  levelGap?: number;
}
