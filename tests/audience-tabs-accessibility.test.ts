import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const audienceTabsSource = readFileSync('src/components/landing/AudienceTabs.tsx', 'utf-8');

describe('audience tabs accessibility', () => {
  it('supports arrow-key navigation that also moves focus between mobile accordion headers', () => {
    assert.ok(audienceTabsSource.includes("event.key === 'ArrowDown'"));
    assert.ok(audienceTabsSource.includes("event.key === 'ArrowUp'"));
    assert.ok(audienceTabsSource.includes("event.key === 'Home'"));
    assert.ok(audienceTabsSource.includes("event.key === 'End'"));
    assert.ok(audienceTabsSource.includes('focusSectionButton(nextSectionId)'));
    assert.ok(audienceTabsSource.includes('focusSectionButton(previousSectionId)'));
    assert.ok(audienceTabsSource.includes('focusSectionButton(sections[0].id)'));
    assert.ok(audienceTabsSource.includes('focusSectionButton(lastSectionId)'));
  });

  it('keeps helper text and controlled-region relationships for accordion buttons', () => {
    assert.ok(audienceTabsSource.includes('aria-controls={panelId}'));
    assert.ok(audienceTabsSource.includes('aria-describedby={helperId}'));
    assert.ok(audienceTabsSource.includes('role="region"'));
    assert.ok(audienceTabsSource.includes('aria-labelledby={buttonId}'));
  });
});
