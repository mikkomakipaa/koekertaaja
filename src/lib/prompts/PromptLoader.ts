import { readFile } from 'fs/promises';
import path from 'path';

import { createLogger } from '@/lib/logger';

const TEMPLATE_BASE_PATH = path.join(
  process.cwd(),
  'src',
  'config',
  'prompt-templates'
);

const logger = createLogger({ module: 'PromptLoader' });

export class PromptLoader {
  private moduleCache = new Map<string, string>();

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
      const contents = await readFile(absolutePath, 'utf-8');
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
