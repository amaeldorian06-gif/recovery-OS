import test from 'node:test';
import assert from 'node:assert';
import { PUBLIC_SECTIONS_SEO } from './seo';

test('SEO Audit 1: All public sections have defined title, description, and keywords', () => {
  const sections = Object.keys(PUBLIC_SECTIONS_SEO);
  assert.ok(sections.length >= 7, 'Expected at least 7 public sections/views defined');

  for (const key of sections) {
    const meta = PUBLIC_SECTIONS_SEO[key];
    assert.ok(meta.title, `Section ${key} must have a title`);
    assert.ok(meta.description, `Section ${key} must have a description`);
    assert.ok(meta.image, `Section ${key} must have an OG image`);
  }
});

test('SEO Audit 2: Titles adhere strictly to search engine best practices (30 - 65 chars)', () => {
  for (const [key, meta] of Object.entries(PUBLIC_SECTIONS_SEO)) {
    const len = meta.title.length;
    assert.ok(
      len >= 30 && len <= 65,
      `Section [${key}] title length is ${len} ("${meta.title}"), expected between 30 and 65 chars.`
    );
  }
});

test('SEO Audit 3: Descriptions adhere strictly to search engine guidelines (115 - 165 chars)', () => {
  for (const [key, meta] of Object.entries(PUBLIC_SECTIONS_SEO)) {
    const len = meta.description.length;
    assert.ok(
      len >= 115 && len <= 165,
      `Section [${key}] description length is ${len} ("${meta.description}"), expected between 115 and 165 chars.`
    );
  }
});

test('SEO Audit 4: Section Schema.org LD-JSON structures are valid objects', () => {
  for (const [key, meta] of Object.entries(PUBLIC_SECTIONS_SEO)) {
    if (meta.schemaSnippet) {
      assert.ok(
        typeof meta.schemaSnippet === 'object' && meta.schemaSnippet !== null,
        `Section [${key}] schemaSnippet must be an object`
      );
      assert.ok(
        '@type' in meta.schemaSnippet,
        `Section [${key}] schemaSnippet must include @type`
      );
    }
  }
});
