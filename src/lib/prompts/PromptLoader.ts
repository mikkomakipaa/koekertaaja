import { readFile } from 'fs/promises';
import path from 'path';

import { createLogger } from '@/lib/logger';
import type { PromptVersion } from './promptVersion';

const TEMPLATE_BASE_PATH = path.join(
  process.cwd(),
  'src',
  'config',
  'prompt-templates'
);

const logger = createLogger({ module: 'PromptLoader' });
const DEFAULT_PROMPT_VERSION = '1.0.0';
const SEMVER_REGEX = /^\d+\.\d+\.\d+$/;

export class PromptLoader {
  private moduleCache = new Map<string, string>();
  private moduleVersions = new Map<string, PromptVersion>();

  /**
   * Load a prompt module from the filesystem.
   */
  async loadModule(modulePath: string): Promise<string> {
    this.validateModulePath(modulePath);

    if (this.moduleCache.has(modulePath)) {
      return this.moduleCache.get(modulePath)!;
    }

    const absolutePath = path.join(TEMPLATE_BASE_PATH, modulePath);

    try {
      const rawContents = await readFile(absolutePath, 'utf-8');
      const parsedHeader = this.parseVersionHeader(rawContents);
      const fallbackVersion: PromptVersion = {
        version: DEFAULT_PROMPT_VERSION,
        template: modulePath,
        lastUpdated: '1970-01-01',
        author: 'unknown',
        changes: 'No version header found',
        breaking: false,
      };

      let versionInfo = parsedHeader
        ? {
            ...parsedHeader,
            template: modulePath,
          }
        : fallbackVersion;

      if (parsedHeader && !SEMVER_REGEX.test(parsedHeader.version)) {
        logger.warn(
          { modulePath, version: parsedHeader.version },
          'Invalid prompt template semver format, defaulting to 1.0.0'
        );
        versionInfo = {
          ...fallbackVersion,
          lastUpdated: parsedHeader.lastUpdated || fallbackVersion.lastUpdated,
          author: parsedHeader.author || fallbackVersion.author,
          changes: `Invalid semver "${parsedHeader.version}"`,
        };
      }

      const contents = parsedHeader ? this.stripVersionHeader(rawContents) : rawContents;
      this.moduleVersions.set(modulePath, versionInfo);
      this.moduleCache.set(modulePath, contents);
      logger.debug({ modulePath }, 'Loaded prompt module');
      return contents;
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`Prompt module not found: ${modulePath}`);
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load prompt module: ${modulePath} (${message})`);
    }
  }

  /**
   * Load multiple prompt modules in parallel.
   */
  async loadModules(modulePaths: string[]): Promise<string[]> {
    return Promise.all(modulePaths.map(modulePath => this.loadModule(modulePath)));
  }

  /**
   * Substitute {{variable}} placeholders with provided values.
   */
  substituteVariables(template: string, vars: Record<string, string>): string {
    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (match, key: string) => {
      if (!Object.prototype.hasOwnProperty.call(vars, key)) {
        throw new Error(`Missing required variable: ${match}`);
      }

      return vars[key];
    });
  }

  parseVersionHeader(content: string): PromptVersion | null {
    const lines = content.split(/\r?\n/);
    const headerValues: Partial<Record<'version' | 'lastUpdated' | 'author' | 'changes' | 'breaking', string>> = {};
    let sawHeaderLine = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (sawHeaderLine) {
          break;
        }
        continue;
      }

      if (!trimmed.startsWith('#')) {
        break;
      }

      sawHeaderLine = true;
      const headerMatch = trimmed.match(/^#\s*([^:]+):\s*(.+)\s*$/);
      if (!headerMatch) {
        continue;
      }

      const key = headerMatch[1].trim().toLowerCase();
      const value = headerMatch[2].trim();

      if (key === 'version') headerValues.version = value;
      if (key === 'last updated') headerValues.lastUpdated = value;
      if (key === 'author') headerValues.author = value;
      if (key === 'changes') headerValues.changes = value;
      if (key === 'breaking') headerValues.breaking = value;
    }

    if (!headerValues.version) {
      return null;
    }

    return {
      version: headerValues.version,
      template: 'unknown',
      lastUpdated: headerValues.lastUpdated ?? '1970-01-01',
      author: headerValues.author ?? 'unknown',
      changes: headerValues.changes ?? 'Not specified',
      breaking: (headerValues.breaking ?? 'false').toLowerCase() === 'true',
    };
  }

  getVersionMetadata(): Record<string, string> {
    return Object.fromEntries(
      Array.from(this.moduleVersions.entries()).map(([template, versionInfo]) => [
        template,
        versionInfo.version,
      ])
    );
  }

  private stripVersionHeader(content: string): string {
    const lines = content.split(/\r?\n/);
    let index = 0;

    while (index < lines.length && lines[index].trim().startsWith('#')) {
      index += 1;
    }
    while (index < lines.length && lines[index].trim() === '') {
      index += 1;
    }

    return lines.slice(index).join('\n');
  }

  private validateModulePath(modulePath: string): void {
    if (!modulePath || modulePath.trim().length === 0) {
      throw new Error('Prompt module path is required');
    }

    if (path.isAbsolute(modulePath)) {
      throw new Error(`Prompt module path must be relative: ${modulePath}`);
    }

    const normalized = path.normalize(modulePath);
    if (normalized.includes('..')) {
      throw new Error(`Prompt module path cannot traverse directories: ${modulePath}`);
    }
  }
}
