export interface PromptVersion {
  version: string;
  template: string;
  lastUpdated: string;
  author: string;
  changes: string;
  breaking: boolean;
}

export interface PromptMetadata {
  versions: Record<string, string>;
  assembledAt: string;
  hash?: string;
}
