'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Parse text and render LaTeX formulas
    const parts = parseLatex(children);

    // Clear container
    containerRef.current.innerHTML = '';

    // Render each part
    parts.forEach((part) => {
      if (part.type === 'text') {
        const textNode = document.createTextNode(part.content);
        containerRef.current!.appendChild(textNode);
      } else if (part.type === 'math') {
        const mathSpan = document.createElement('span');
        mathSpan.className = 'math-inline';

        try {
          katex.render(part.content, mathSpan, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          // If rendering fails, show the original text
          mathSpan.textContent = `$$${part.content}$$`;
          mathSpan.className = 'text-red-500';
        }

        containerRef.current!.appendChild(mathSpan);
      }
    });
  }, [children]);

  return <span ref={containerRef} className={className} />;
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
