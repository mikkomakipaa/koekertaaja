import type {
  MindMapLayout,
  MindMapLayoutEdge,
  MindMapLayoutNode,
  MindMapLayoutOptions,
  MindMapNode,
} from '@/types/mindMap';

const DEFAULT_LAYOUT_WIDTH = 960;
const DEFAULT_LAYOUT_HEIGHT = 960;
const DEFAULT_LEVEL_GAP = 180;

const round = (value: number): number => Math.round(value * 1000) / 1000;

const sortChildren = (children: MindMapNode[]): MindMapNode[] => {
  return [...children].sort((a, b) => a.label.localeCompare(b.label, 'fi'));
};

const computeLeafWeight = (node: MindMapNode): number => {
  if (node.children.length === 0) return 1;
  return sortChildren(node.children).reduce((sum, child) => sum + computeLeafWeight(child), 0);
};

interface Placement {
  node: MindMapNode;
  parentId: string | null;
  depth: number;
  startAngle: number;
  endAngle: number;
}

const placeNodes = (
  placement: Placement,
  centerX: number,
  centerY: number,
  levelGap: number,
  nodes: MindMapLayoutNode[]
): void => {
  const angle = (placement.startAngle + placement.endAngle) / 2;
  const radius = placement.depth * levelGap;

  nodes.push({
    id: placement.node.id,
    parentId: placement.parentId,
    kind: placement.node.kind,
    label: placement.node.label,
    questionCount: placement.node.questionCount,
    mastery: placement.node.mastery,
    depth: placement.depth,
    angle: round(angle),
    radius: round(radius),
    x: round(centerX + Math.cos(angle) * radius),
    y: round(centerY + Math.sin(angle) * radius),
  });

  const children = sortChildren(placement.node.children);
  if (children.length === 0) return;

  const sweep = placement.endAngle - placement.startAngle;
  const weights = children.map((child) => computeLeafWeight(child));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let cursor = placement.startAngle;

  children.forEach((child, index) => {
    const span = sweep * (weights[index] / totalWeight);
    placeNodes(
      {
        node: child,
        parentId: placement.node.id,
        depth: placement.depth + 1,
        startAngle: cursor,
        endAngle: cursor + span,
      },
      centerX,
      centerY,
      levelGap,
      nodes
    );
    cursor += span;
  });
};

const buildEdges = (nodes: MindMapLayoutNode[]): MindMapLayoutEdge[] => {
  const index = new Map(nodes.map((node) => [node.id, node]));
  const edges: MindMapLayoutEdge[] = [];

  for (const node of nodes) {
    if (!node.parentId) continue;
    const parent = index.get(node.parentId);
    if (!parent) continue;

    edges.push({
      id: `${parent.id}->${node.id}`,
      fromId: parent.id,
      toId: node.id,
      x1: parent.x,
      y1: parent.y,
      x2: node.x,
      y2: node.y,
    });
  }

  return edges;
};

export const layoutTree = (tree: MindMapNode, options: MindMapLayoutOptions = {}): MindMapLayout => {
  const width = options.width ?? DEFAULT_LAYOUT_WIDTH;
  const height = options.height ?? DEFAULT_LAYOUT_HEIGHT;
  const levelGap = options.levelGap ?? DEFAULT_LEVEL_GAP;
  const centerX = width / 2;
  const centerY = height / 2;

  const nodes: MindMapLayoutNode[] = [];
  placeNodes(
    {
      node: tree,
      parentId: null,
      depth: 0,
      startAngle: -Math.PI / 2,
      endAngle: (Math.PI * 3) / 2,
    },
    centerX,
    centerY,
    levelGap,
    nodes
  );

  return {
    width,
    height,
    centerX: round(centerX),
    centerY: round(centerY),
    nodes,
    edges: buildEdges(nodes),
  };
};
