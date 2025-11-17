
'use client';

import * as React from 'react';

export const CatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <path d="M32 2C20 2 12 12 12 24c0 8 6 16 16 16s16-8 16-16C52 12 44 2 32 2z" stroke="currentColor" fill="none" strokeWidth="2"/>
    <path d="M24 32c0 6 8 10 8 10s8-4 8-10" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);

export const DogIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="32" r="14" stroke="currentColor" fill="none" strokeWidth="2"/>
    <path d="M18 32c-4 0-4-6-4-6s2-6 10-6 10 6 10 6-0.5 6-4 6" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);

export const RabbitIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <ellipse cx="32" cy="36" rx="12" ry="16" stroke="currentColor" fill="none" strokeWidth="2"/>
    <path d="M24 20c0-6 4-12 8-12s8 6 8 12" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);

export const FoxIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <polygon points="32,2 12,32 32,62 52,32" stroke="currentColor" fill="none" strokeWidth="2"/>
    <path d="M20 32l12-20 12 20-12 20z" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);

export const PandaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="32" r="20" stroke="currentColor" fill="none" strokeWidth="2"/>
    <circle cx="24" cy="28" r="4" fill="currentColor"/>
    <circle cx="40" cy="28" r="4" fill="currentColor"/>
  </svg>
);

export const BearIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 64 64" {...props}>
    <circle cx="32" cy="32" r="18" stroke="currentColor" fill="none" strokeWidth="2"/>
    <circle cx="24" cy="26" r="3" fill="currentColor"/>
    <circle cx="40" cy="26" r="3" fill="currentColor"/>
    <path d="M24 40c4 4 12 4 16 0" stroke="currentColor" fill="none" strokeWidth="2"/>
  </svg>
);
