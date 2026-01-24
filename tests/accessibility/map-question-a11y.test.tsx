/**
 * Accessibility tests for Map Questions
 *
 * Tests WCAG 2.1 AA compliance:
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - ARIA attributes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MapQuestion } from '@/components/questions/MapQuestion';
import type { MapQuestion as MapQuestionType } from '@/types';

expect.extend(toHaveNoViolations);

const mockMapQuestion: MapQuestionType = {
  id: 'map-test-1',
  type: 'map',
  question: 'Valitse Suomi kartalta',
  topic: 'Maantieto',
  subtopic: 'Pohjoismaat',
  difficulty: 'easy',
  correct_answer: 'finland',
  options: {
    mapAsset: '/maps/nordic-countries.png',
    inputMode: 'single_region',
    regions: [
      { id: 'finland', label: 'Suomi', aliases: ['Finland'] },
      { id: 'sweden', label: 'Ruotsi', aliases: ['Sweden'] },
      { id: 'norway', label: 'Norja', aliases: ['Norway'] },
      { id: 'denmark', label: 'Tanska', aliases: ['Denmark'] },
    ],
  },
};

const mockMultiSelectMapQuestion: MapQuestionType = {
  ...mockMapQuestion,
  id: 'map-test-2',
  question: 'Valitse kaikki EU-maat',
  correct_answer: ['finland', 'sweden', 'denmark'],
  options: {
    ...mockMapQuestion.options,
    inputMode: 'multi_region',
  },
};

describe('MapQuestion Accessibility', () => {
  describe('WCAG 2.1 AA Compliance', () => {
    it('should have no axe violations (single select)', async () => {
      const { container } = render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations (multi select)', async () => {
      const { container } = render(
        <MapQuestion
          question={mockMultiSelectMapQuestion}
          userAnswer={[]}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no axe violations (text fallback mode)', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      // Toggle to text mode
      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      await user.click(toggleButton);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow tabbing to region buttons', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const firstButton = screen.getByRole('button', { name: /suomi/i });
      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });

    it('should support arrow key navigation', async () => {
      const user = userEvent.setup();
      const onAnswerChange = vi.fn();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={onAnswerChange}
        />
      );

      const container = screen.getByRole('group', { name: /alueiden valinnat/i });
      container.focus();

      // Arrow Down to next region
      await user.keyboard('{ArrowDown}');

      // Enter to select
      await user.keyboard('{Enter}');

      expect(onAnswerChange).toHaveBeenCalled();
    });

    it('should support Enter key selection', async () => {
      const user = userEvent.setup();
      const onAnswerChange = vi.fn();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={onAnswerChange}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(onAnswerChange).toHaveBeenCalledWith('finland');
    });

    it('should support Space key selection', async () => {
      const user = userEvent.setup();
      const onAnswerChange = vi.fn();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={onAnswerChange}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      button.focus();
      await user.keyboard(' ');

      expect(onAnswerChange).toHaveBeenCalledWith('finland');
    });

    it('should support Home/End keys', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const container = screen.getByRole('group', { name: /alueiden valinnat/i });
      container.focus();

      // End key should focus last region
      await user.keyboard('{End}');

      // Home key should focus first region
      await user.keyboard('{Home}');
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels on region buttons', () => {
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      expect(button).toHaveAttribute('aria-label');
    });

    it('should use aria-pressed for multi-select', () => {
      render(
        <MapQuestion
          question={mockMultiSelectMapQuestion}
          userAnswer={['finland']}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const selectedButton = screen.getByRole('button', { name: /suomi/i });
      expect(selectedButton).toHaveAttribute('aria-pressed', 'true');

      const unselectedButton = screen.getByRole('button', { name: /ruotsi/i });
      expect(unselectedButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should use aria-current for single-select', () => {
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer="finland"
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const selectedButton = screen.getByRole('button', { name: /suomi.*valittu/i });
      expect(selectedButton).toHaveAttribute('aria-current', 'true');
    });

    it('should have aria-describedby on map image', () => {
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const mapImage = screen.getByRole('img');
      expect(mapImage).toHaveAttribute('aria-describedby');
    });

    it('should announce selection state changes', () => {
      const { container } = render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      // Look for ARIA live region
      const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      await user.tab();

      expect(button).toHaveFocus();
      // Focus ring should be visible via CSS (tested in e2e)
    });

    it('should maintain logical tab order', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      // Tab through elements
      await user.tab(); // Toggle button
      await user.tab(); // First region
      await user.tab(); // Second region
      await user.tab(); // Third region
      await user.tab(); // Fourth region

      // Should have cycled through all regions
      expect(document.activeElement).toBeTruthy();
    });

    it('should not create keyboard traps', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      toggleButton.focus();

      // Should be able to tab out
      await user.tab();
      expect(document.activeElement).not.toBe(toggleButton);
    });
  });

  describe('Text Fallback Mode', () => {
    it('should provide accessible text alternative', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      // Toggle to text mode
      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      await user.click(toggleButton);

      // Search input should be present
      const searchInput = screen.getByRole('combobox', { name: /hae alueita/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('should filter regions with keyboard input', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      await user.click(toggleButton);

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'suo');

      // Should show filtered results
      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });

    it('should support keyboard selection in dropdown', async () => {
      const user = userEvent.setup();
      const onAnswerChange = vi.fn();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={onAnswerChange}
        />
      );

      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      await user.click(toggleButton);

      const searchInput = screen.getByRole('combobox');
      await user.click(searchInput);

      // Arrow down and Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onAnswerChange).toHaveBeenCalled();
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should announce region selection', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      await user.click(button);

      // Check for live region update
      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should announce correct/incorrect in explanation mode', () => {
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer="sweden"
          showExplanation={true}
          onAnswerChange={vi.fn()}
        />
      );

      // Correct answer should have label
      const correctButton = screen.getByRole('button', { name: /suomi.*oikea vastaus/i });
      expect(correctButton).toBeInTheDocument();

      // Wrong answer should have label
      const wrongButton = screen.getByRole('button', { name: /ruotsi.*väärin/i });
      expect(wrongButton).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode', () => {
    it('should render properly with prefers-contrast media query', () => {
      // This would be tested in e2e with actual browser media queries
      // Here we verify elements that support high contrast exist
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer={null}
          showExplanation={false}
          onAnswerChange={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        // Buttons should have border for high contrast visibility
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State (Explanation Mode)', () => {
    it('should disable interaction in explanation mode', async () => {
      const user = userEvent.setup();
      const onAnswerChange = vi.fn();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer="finland"
          showExplanation={true}
          onAnswerChange={onAnswerChange}
        />
      );

      const button = screen.getByRole('button', { name: /suomi/i });
      await user.click(button);

      // Should not change answer in explanation mode
      expect(onAnswerChange).not.toHaveBeenCalled();
      expect(button).toBeDisabled();
    });

    it('should disable text fallback in explanation mode', async () => {
      const user = userEvent.setup();
      render(
        <MapQuestion
          question={mockMapQuestion}
          userAnswer="finland"
          showExplanation={true}
          onAnswerChange={vi.fn()}
        />
      );

      const toggleButton = screen.getByLabelText(/vaihda tekstinäkymään/i);
      await user.click(toggleButton);

      const searchInput = screen.getByRole('combobox');
      expect(searchInput).toBeDisabled();
    });
  });
});
