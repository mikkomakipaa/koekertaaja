import assert from 'node:assert/strict';
import test from 'node:test';

import {
  analyzeVisualPotential,
  classifyVisual,
  extractCaption,
  extractContext,
  extractMaterialWithVisuals,
  parseImageReference,
} from './visualExtraction';

test('classifyVisual identifies table/chart/diagram', () => {
  assert.equal(classifyVisual('Taulukko 1: Väkiluvut', ''), 'table');
  assert.equal(classifyVisual('Kuva 2: Kasvukaavio', ''), 'chart');
  assert.equal(classifyVisual('Kuva 1: Kolmio ABC', 'kolmio'), 'diagram');
  assert.equal(classifyVisual(undefined, 'satunnainen kuvaus'), 'image');
});

test('extractCaption finds Finnish and English caption patterns', () => {
  const text = 'Johdanto.\nKuva 1: Kolmio ABC\nTable 2: Population by year';

  assert.equal(extractCaption(text, 0), 'Kuva 1: Kolmio ABC');
});

test('extractContext returns text around given index', () => {
  const text = '0123456789abcdefghijklmnopqrstuvwxyz';
  const context = extractContext(text, 15, 5);

  assert.equal(context, 'abcdefghij');
});

test('extractMaterialWithVisuals maps image files to extracted visuals', async () => {
  const result = await extractMaterialWithVisuals({
    materialText: 'Kuva 1: Kolmio. Tämä kappale käsittelee geometriaa.',
    materialFiles: [
      {
        type: 'image/png',
        name: 'kolmio_diagrammi.png',
        data: Buffer.from('fake-image-1').toString('base64'),
      },
      {
        type: 'application/pdf',
        name: 'materiaali.pdf',
        data: Buffer.from('fake-pdf').toString('base64'),
      },
    ],
  });

  assert.equal(result.metadata.hasVisuals, true);
  assert.equal(result.metadata.visualCount, 1);
  assert.equal(result.metadata.pdfFileCount, 1);
  assert.equal(result.visuals[0].id, 'image_1');
  assert.equal(result.visuals[0].base64Data.startsWith('data:image/png;base64,'), true);
});

test('extractMaterialWithVisuals respects maxVisuals limit', async () => {
  const result = await extractMaterialWithVisuals({
    materialText: 'kuvamateriaali',
    maxVisuals: 1,
    materialFiles: [
      { type: 'image/png', name: 'a.png', data: Buffer.from('a').toString('base64') },
      { type: 'image/png', name: 'b.png', data: Buffer.from('b').toString('base64') },
    ],
  });

  assert.equal(result.visuals.length, 1);
});

test('parseImageReference parses IMAGE_X tokens', () => {
  assert.equal(parseImageReference('IMAGE_1'), 0);
  assert.equal(parseImageReference('image_9'), 8);
  assert.equal(parseImageReference('Kuva [IMAGE_2]'), 1);
  assert.equal(parseImageReference('invalid'), null);
});

test('analyzeVisualPotential returns high potential for diagrams', () => {
  const analysis = analyzeVisualPotential(
    {
      id: 'image_1',
      type: 'diagram',
      pageNumber: 1,
      base64Data: 'data:image/png;base64,Zm9v',
      mediaType: 'image/png',
      caption: 'Kuva 1: Kolmio',
      contextText: 'Pythagoraan lause',
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
    },
    'matematiikka'
  );

  assert.equal(analysis.questionPotential, 'high');
  assert.equal(analysis.suggestedQuestionTypes.includes('measurement'), true);
});
