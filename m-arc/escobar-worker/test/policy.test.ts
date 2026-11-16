import { describe, it, expect } from 'vitest';
import { WORKER_POLICY } from '../src/prompt/policy';

describe('WORKER_POLICY safety wording (D-LR23-1)', () => {
  it('carries both new safety and formatting sentences', () => {
    expect(WORKER_POLICY).toContain(
      'The app shows its own short safety card. Never give phone numbers, hotlines, helplines, websites or the names of services. Match the advice to the symptoms: if someone may be in danger now, tell them to get emergency help now; otherwise tell them to stop, and to get it checked if the pain, numbness or other symptom is still there after a few hours or days or gets worse, or to talk with someone they trust or a doctor.'
    );
    expect(WORKER_POLICY).toContain(
      "Don't name research studies, their authors or health organisations as sources, and don't quote evidence ratings; say how sure the evidence is in plain words."
    );
  });

  it('drops the old "adds the support resources" line', () => {
    expect(WORKER_POLICY).not.toContain('adds the support resources');
  });

  it('keeps the "get emergency help now" instruction', () => {
    expect(WORKER_POLICY).toContain('get emergency help now');
  });

  it('matches advice to the symptoms and their timing (owner, 2026-09-30)', () => {
    expect(WORKER_POLICY).toContain('Match the advice to the symptoms');
    expect(WORKER_POLICY).toContain('still there after a few hours or days or gets worse');
  });
});

describe('WORKER_POLICY rule 3 citation form and repair wording (ESC-W-CITE)', () => {
  it('teaches the brief form [f3] only as a source, and the answer form as ⟦f3⟧ (W1)', () => {
    expect(WORKER_POLICY).toContain(
      'The fact ids are in each tool result\'s "facts" map and inline in the brief as [f3]. In your answer always write them as ⟦f3⟧, never as [f3].'
    );
    // the worked example keeps the answer form
    expect(WORKER_POLICY).toContain('like 102.5 kg ⟦f12⟧ (several: ⟦f12,f14⟧)');
  });

  it('asks for the whole answer again, without mentioning the check, after a verification check (W2)', () => {
    expect(WORKER_POLICY).toContain(
      'If the app sends a verification check, recompute the numbers it lists with tools or remove them, then write your whole answer again as your reply to the person, without mentioning the check.'
    );
    expect(WORKER_POLICY).not.toContain('then restate the answer');
  });
});
