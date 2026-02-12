import mathematicsDependencies from '@/config/curriculum/dependencies/mathematics-dependencies.json' with { type: 'json' };
import finnishDependencies from '@/config/curriculum/dependencies/finnish-dependencies.json' with { type: 'json' };
import chemistryDependencies from '@/config/curriculum/dependencies/chemistry-dependencies.json' with { type: 'json' };
import physicsDependencies from '@/config/curriculum/dependencies/physics-dependencies.json' with { type: 'json' };
import societyDependencies from '@/config/curriculum/dependencies/society-dependencies.json' with { type: 'json' };

export interface ConceptNode {
  id: string;
  label: string;
  prerequisites: string[];
  enables: string[];
  subject: string;
  grade: number;
}

export interface DependencyGraph {
  nodes: Map<string, ConceptNode>;
  edges: Map<string, Set<string>>;
  aliases: Map<string, string>;
}

interface ConceptDependencyData {
  [gradeKey: string]: {
    [conceptKey: string]: {
      id: string;
      label: string;
      prerequisites: string[];
      enables: string[];
    };
  };
}

interface ValidationOptions {
  grade?: number;
  knownConcepts?: Iterable<string>;
}

interface ReorderResult<T> {
  reorderedQuestions: T[];
  changed: boolean;
  validation: DependencyValidationResult;
}

export interface DependencyViolation {
  question: number;
  concept: string;
  missingPrereq: string;
}

export interface DependencyValidationResult {
  valid: boolean;
  violations: DependencyViolation[];
}

const SUBJECT_ALIAS_MAP: Record<string, string> = {
  math: 'mathematics',
  mathematics: 'mathematics',
  finnish: 'finnish',
  chemistry: 'chemistry',
  physics: 'physics',
  society: 'society',
  social_studies: 'society',
  socialstudies: 'society',
};

const DEFAULT_GRAPH_DATA: Record<string, ConceptDependencyData> = {
  mathematics: mathematicsDependencies as ConceptDependencyData,
  finnish: finnishDependencies as ConceptDependencyData,
  chemistry: chemistryDependencies as ConceptDependencyData,
  physics: physicsDependencies as ConceptDependencyData,
  society: societyDependencies as ConceptDependencyData,
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    output.push(value);
  }
  return output;
}

export class ConceptDependencyResolver {
  private graphs: Map<string, DependencyGraph> = new Map();
  private prerequisitesCache: Map<string, Set<string>> = new Map();

  constructor(data: Record<string, ConceptDependencyData> = DEFAULT_GRAPH_DATA) {
    this.loadDependencies(data);
  }

  private loadDependencies(data: Record<string, ConceptDependencyData>): void {
    Object.entries(data).forEach(([subject, subjectData]) => {
      this.graphs.set(subject, this.buildGraph(subjectData, subject));
    });
  }

  private buildGraph(data: ConceptDependencyData, subject: string): DependencyGraph {
    const nodes = new Map<string, ConceptNode>();
    const edges = new Map<string, Set<string>>();
    const aliases = new Map<string, string>();

    Object.entries(data).forEach(([gradeKey, concepts]) => {
      const grade = Number.parseInt(gradeKey.replace('grade_', ''), 10);
      if (Number.isNaN(grade)) {
        return;
      }

      Object.values(concepts).forEach((concept) => {
        const normalizedConceptId = normalizeKey(concept.id);
        const node: ConceptNode = {
          ...concept,
          id: normalizedConceptId,
          prerequisites: concept.prerequisites.map((prereq) => normalizeKey(prereq)),
          enables: concept.enables.map((enabled) => normalizeKey(enabled)),
          subject,
          grade,
        };

        nodes.set(node.id, node);
        edges.set(node.id, new Set(node.prerequisites));
        aliases.set(node.id, node.id);
        aliases.set(normalizeKey(node.label), node.id);
      });
    });

    return { nodes, edges, aliases };
  }

  private normalizeSubject(subject: string): string | null {
    const normalized = normalizeKey(subject);
    const resolved = SUBJECT_ALIAS_MAP[normalized] ?? normalized;
    return this.graphs.has(resolved) ? resolved : null;
  }

  public hasDependenciesForSubject(subject: string): boolean {
    return this.normalizeSubject(subject) !== null;
  }

  public resolveConceptId(subject: string, candidate?: string): string | null {
    if (!candidate) {
      return null;
    }

    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey) {
      return null;
    }

    const graph = this.graphs.get(subjectKey);
    if (!graph) {
      return null;
    }

    const normalized = normalizeKey(candidate);
    if (!normalized) {
      return null;
    }

    if (graph.nodes.has(normalized)) {
      return normalized;
    }

    const fromAlias = graph.aliases.get(normalized);
    return fromAlias ?? null;
  }

  public extractConceptIdFromQuestion(
    subject: string,
    question: {
      concept_id?: string;
      conceptId?: string;
      subtopic?: string;
      skill?: string;
      topic?: string;
    }
  ): string | null {
    const candidates = [
      question.concept_id,
      question.conceptId,
      question.subtopic,
      question.skill,
      question.topic,
    ];

    for (const candidate of candidates) {
      const conceptId = this.resolveConceptId(subject, candidate);
      if (conceptId) {
        return conceptId;
      }
    }

    return null;
  }

  public getAllPrerequisites(subject: string, conceptId: string): Set<string> {
    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey) {
      return new Set();
    }

    const resolvedConceptId = this.resolveConceptId(subjectKey, conceptId);
    if (!resolvedConceptId) {
      return new Set();
    }

    const cacheKey = `${subjectKey}:${resolvedConceptId}`;
    const cached = this.prerequisitesCache.get(cacheKey);
    if (cached) {
      return new Set(cached);
    }

    const graph = this.graphs.get(subjectKey);
    if (!graph) {
      return new Set();
    }

    const result = new Set<string>();
    const visited = new Set<string>();

    const dfs = (id: string) => {
      if (visited.has(id)) {
        return;
      }

      visited.add(id);
      const prereqs = graph.edges.get(id);
      if (!prereqs) {
        return;
      }

      prereqs.forEach((prereqId) => {
        result.add(prereqId);
        dfs(prereqId);
      });
    };

    dfs(resolvedConceptId);
    this.prerequisitesCache.set(cacheKey, result);
    return new Set(result);
  }

  public canTeachBefore(subject: string, conceptA: string, conceptB: string): boolean {
    const conceptAId = this.resolveConceptId(subject, conceptA);
    const conceptBId = this.resolveConceptId(subject, conceptB);

    if (!conceptAId || !conceptBId) {
      return true;
    }

    if (conceptAId === conceptBId) {
      return false;
    }

    const prerequisitesForA = this.getAllPrerequisites(subject, conceptAId);
    return !prerequisitesForA.has(conceptBId);
  }

  public getTeachingOrder(subject: string, conceptIds: string[]): string[] {
    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey) {
      return conceptIds;
    }

    const graph = this.graphs.get(subjectKey);
    if (!graph) {
      return conceptIds;
    }

    const resolved = conceptIds.map((conceptId) => this.resolveConceptId(subjectKey, conceptId) ?? conceptId);
    const unique = uniqueInOrder(resolved);
    const knownUnique = unique.filter((conceptId) => graph.nodes.has(conceptId));
    const unknownUnique = unique.filter((conceptId) => !graph.nodes.has(conceptId));
    const resolvedSet = new Set(knownUnique);

    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, Set<string>>();

    knownUnique.forEach((id) => {
      inDegree.set(id, 0);
      adjacency.set(id, new Set());
    });

    knownUnique.forEach((id) => {
      const prereqs = graph.edges.get(id);
      if (!prereqs) {
        return;
      }

      prereqs.forEach((prereq) => {
        if (!resolvedSet.has(prereq)) {
          return;
        }
        adjacency.get(prereq)?.add(id);
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      });
    });

    const queue = knownUnique.filter((id) => (inDegree.get(id) ?? 0) === 0);
    const result: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      adjacency.get(current)?.forEach((neighbor) => {
        const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (result.length !== knownUnique.length) {
      return conceptIds;
    }

    return [...result, ...unknownUnique];
  }

  public getFoundationalConceptsForGrade(subject: string, grade?: number): Set<string> {
    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey || typeof grade !== 'number') {
      return new Set();
    }

    const graph = this.graphs.get(subjectKey);
    if (!graph) {
      return new Set();
    }

    const foundational = new Set<string>();

    graph.nodes.forEach((node) => {
      if (node.grade < grade) {
        foundational.add(node.id);
      }
    });

    return foundational;
  }

  public getAvailableConcepts(subject: string, grade?: number, coveredConcepts: string[] = []): ConceptNode[] {
    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey || typeof grade !== 'number') {
      return [];
    }

    const graph = this.graphs.get(subjectKey);
    if (!graph) {
      return [];
    }

    const covered = new Set<string>(
      coveredConcepts
        .map((concept) => this.resolveConceptId(subjectKey, concept))
        .filter((concept): concept is string => Boolean(concept))
    );

    const known = new Set<string>([...this.getFoundationalConceptsForGrade(subjectKey, grade), ...covered]);

    return Array.from(graph.nodes.values())
      .filter((node) => node.grade <= grade)
      .filter((node) => !covered.has(node.id))
      .filter((node) => node.prerequisites.every((prereq) => known.has(prereq)))
      .sort((a, b) => {
        if (a.grade !== b.grade) {
          return a.grade - b.grade;
        }
        return a.label.localeCompare(b.label, 'fi');
      });
  }

  public validateQuestionSet(
    subject: string,
    questions: Array<{ conceptId: string; order: number }>,
    options: ValidationOptions = {}
  ): DependencyValidationResult {
    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey) {
      return { valid: true, violations: [] };
    }

    const providedKnownConcepts = options.knownConcepts
      ? Array.from(options.knownConcepts)
      : [];
    const knownConcepts = new Set<string>([
      ...this.getFoundationalConceptsForGrade(subjectKey, options.grade),
      ...providedKnownConcepts
        .map((concept) => this.resolveConceptId(subjectKey, concept))
        .filter((concept): concept is string => Boolean(concept)),
    ]);

    const violations: DependencyViolation[] = [];
    const sorted = [...questions].sort((a, b) => a.order - b.order);

    sorted.forEach(({ conceptId, order }) => {
      const resolvedConcept = this.resolveConceptId(subjectKey, conceptId);
      if (!resolvedConcept) {
        return;
      }

      const prerequisites = this.getAllPrerequisites(subjectKey, resolvedConcept);
      prerequisites.forEach((prerequisite) => {
        if (!knownConcepts.has(prerequisite)) {
          violations.push({
            question: order,
            concept: resolvedConcept,
            missingPrereq: prerequisite,
          });
        }
      });

      knownConcepts.add(resolvedConcept);
    });

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  public reorderQuestionsByDependencies<T extends { order_index?: number }>(
    subject: string,
    questions: T[],
    options: ValidationOptions = {}
  ): ReorderResult<T> {
    if (questions.length <= 1) {
      return {
        reorderedQuestions: questions,
        changed: false,
        validation: { valid: true, violations: [] },
      };
    }

    const subjectKey = this.normalizeSubject(subject);
    if (!subjectKey) {
      return {
        reorderedQuestions: questions,
        changed: false,
        validation: { valid: true, violations: [] },
      };
    }

    const conceptByIndex = new Map<number, string>();
    const questionDescriptors: Array<{ conceptId: string; order: number }> = [];

    questions.forEach((question, index) => {
      const conceptId = this.extractConceptIdFromQuestion(
        subjectKey,
        question as unknown as {
          concept_id?: string;
          conceptId?: string;
          subtopic?: string;
          skill?: string;
          topic?: string;
        }
      );

      if (!conceptId) {
        return;
      }

      conceptByIndex.set(index, conceptId);
      questionDescriptors.push({ conceptId, order: index });
    });

    if (conceptByIndex.size <= 1) {
      return {
        reorderedQuestions: questions.map((question, index) => ({ ...question, order_index: index })),
        changed: false,
        validation: { valid: true, violations: [] },
      };
    }

    const initialValidation = this.validateQuestionSet(subjectKey, questionDescriptors, options);
    if (initialValidation.valid) {
      return {
        reorderedQuestions: questions.map((question, index) => ({ ...question, order_index: index })),
        changed: false,
        validation: initialValidation,
      };
    }

    const foundational = this.getFoundationalConceptsForGrade(subjectKey, options.grade);
    const conceptIndexes = new Map<string, number[]>();

    conceptByIndex.forEach((conceptId, index) => {
      const existing = conceptIndexes.get(conceptId) ?? [];
      existing.push(index);
      conceptIndexes.set(conceptId, existing);
    });

    const edgeSet = new Set<string>();
    const inDegree = new Map<number, number>();
    const adjacency = new Map<number, Set<number>>();

    questions.forEach((_, index) => {
      inDegree.set(index, 0);
      adjacency.set(index, new Set());
    });

    conceptByIndex.forEach((conceptId, dependentIndex) => {
      const prerequisites = this.getAllPrerequisites(subjectKey, conceptId);
      prerequisites.forEach((prereq) => {
        if (foundational.has(prereq)) {
          return;
        }

        const prerequisiteCandidates = conceptIndexes.get(prereq);
        if (!prerequisiteCandidates || prerequisiteCandidates.length === 0) {
          return;
        }

        const prerequisiteIndex = prerequisiteCandidates[0];
        if (prerequisiteIndex === dependentIndex) {
          return;
        }

        const edgeKey = `${prerequisiteIndex}->${dependentIndex}`;
        if (edgeSet.has(edgeKey)) {
          return;
        }

        edgeSet.add(edgeKey);
        adjacency.get(prerequisiteIndex)?.add(dependentIndex);
        inDegree.set(dependentIndex, (inDegree.get(dependentIndex) ?? 0) + 1);
      });
    });

    const queue = Array.from(inDegree.entries())
      .filter(([, degree]) => degree === 0)
      .map(([index]) => index)
      .sort((a, b) => a - b);

    const orderedIndexes: number[] = [];

    while (queue.length > 0) {
      const current = queue.shift()!;
      orderedIndexes.push(current);

      const neighbors = Array.from(adjacency.get(current) ?? []).sort((a, b) => a - b);
      neighbors.forEach((neighbor) => {
        const next = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, next);
        if (next === 0) {
          queue.push(neighbor);
          queue.sort((a, b) => a - b);
        }
      });
    }

    if (orderedIndexes.length !== questions.length) {
      return {
        reorderedQuestions: questions.map((question, index) => ({ ...question, order_index: index })),
        changed: false,
        validation: initialValidation,
      };
    }

    const reorderedQuestions = orderedIndexes.map((index, reorderedIndex) => ({
      ...questions[index],
      order_index: reorderedIndex,
    }));

    const reorderedDescriptors: Array<{ conceptId: string; order: number }> = [];
    reorderedQuestions.forEach((question, order) => {
      const conceptId = this.extractConceptIdFromQuestion(
        subjectKey,
        question as unknown as {
          concept_id?: string;
          conceptId?: string;
          subtopic?: string;
          skill?: string;
          topic?: string;
        }
      );
      if (!conceptId) {
        return;
      }
      reorderedDescriptors.push({ conceptId, order });
    });

    const reorderedValidation = this.validateQuestionSet(subjectKey, reorderedDescriptors, options);

    return {
      reorderedQuestions,
      changed: orderedIndexes.some((originalIndex, reorderedIndex) => originalIndex !== reorderedIndex),
      validation: reorderedValidation,
    };
  }

  public getDependencyPromptSection(subject: string, grade?: number): string {
    if (typeof grade !== 'number') {
      return '';
    }

    const available = this.getAvailableConcepts(subject, grade, []);
    if (available.length === 0) {
      return '';
    }

    const conceptLines = available
      .slice(0, 20)
      .map((concept) => {
        const prerequisiteLabels = concept.prerequisites.length > 0
          ? ` (vaatii: ${concept.prerequisites.join(', ')})`
          : ' (perustaso)';
        return `- ${concept.id}: ${concept.label}${prerequisiteLabels}`;
      })
      .join('\n');

    const truncatedNote = available.length > 20
      ? `\n- ... ja ${available.length - 20} muuta konseptia.`
      : '';

    return [
      'KONSEPTIEN RIIPPUVUUSOHJE (PAKOLLINEN):',
      '- Jos kysymys vastaa alla olevia konsepteja, aseta "subtopic" täsmälleen konseptin id-arvoksi.',
      '- Älä tuota riippuvaisia konsepteja ennen niiden edellyttämiä perusteita saman kysymyssarjan sisällä.',
      '- Käytä seuraavia konsepteja ja id-arvoja:',
      conceptLines + truncatedNote,
      '- Jos aihe ei sovi listaan suoraan, käytä normaalia topic/subtopic-tagiusta.',
    ].join('\n');
  }
}

export const dependencyResolver = new ConceptDependencyResolver();
