// The How-to sheet's sections below the tempo (plan 2.4, items 3-8), in sheet order. HT-3 ships it empty;
// each layer card adds one line here (keep both sides when merging).
import type { FunctionComponent } from 'preact';
import type { BuiltHowTo } from '@/howto/types';
import { HandSections } from './Hand';
import { PostureSection } from './Posture';
import { Feel } from './Feel';

export interface SectionProps {
  readonly howTo: BuiltHowTo;
}

export interface SectionDef {
  /** Stable id, also the section element's `data-section`. */
  readonly id: string;
  readonly Component: FunctionComponent<SectionProps>;
}

export const SECTIONS: readonly SectionDef[] = [
  { id: 'hand', Component: HandSections },   // HT-6: Look closer, Grip, Common handling mistakes
  { id: 'posture', Component: PostureSection },   // HT-7: the posture close-ups' dot pattern (the chips are Look closer's)
  { id: 'feel', Component: Feel },   // HT-8
];
