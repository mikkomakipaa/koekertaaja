'use client';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Fragment } from 'react';

interface MathTextProps {
  children: string;
  className?: string;
}

/**
 * Component that renders text with LaTeX math notation.
 * LaTeX formulas should be wrapped in $$...$$ delimiters.
 *
 * Example: "Laske: $$7000 \div 1000$$ = ____"
 */
export function MathText({ children, className = '' }: MathTextProps) {
  const parts = parseLatex(children);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <Fragment key={`text-${index}`}>{part.content}</Fragment>;
        }

        try {
          return (
            <span
              key={`math-${index}`}
              className="math-inline"
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.content, {
                  throwOnError: false,
                  displayMode: false,
                }),
              }}
            />
          );
        } catch {
          return (
            <span key={`math-error-${index}`} className="text-red-500">
              {`$$${part.content}$$`}
            </span>
          );
        }
      })}
    </span>
  );
}

/**
 * Parse text and extract LaTeX formulas marked with $$...$$
 */
function parseLatex(text: string): Array<{ type: 'text' | 'math'; content: string }> {
  const parts: Array<{ type: 'text' | 'math'; content: string }> = [];

  // Regular expression to find $$...$$ patterns
  const regex = /\$\$(.*?)\$\$/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex, match.index),
      });
    }

    // Add the LaTeX formula
    parts.push({
      type: 'math',
      content: match[1],
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last match
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.substring(lastIndex),
    });
  }

  return parts;
}
