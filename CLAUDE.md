# Oluwaseyi Portfolio — Project Guide

## Overview
Personal portfolio website for Oluwaseyi, presenting two core service pillars:
1. **AI Automation** (n8n workflow automation, AI agents, CRM & business process integrations)
2. **Website Design & Development** (business websites, landing pages, e-commerce, web applications)

## Design System & Rules
- Strictly black-and-white editorial aesthetic (#FFFFFF, #000000, #333333, #555555, #E5E5E5).
- No arbitrary colors, blue accents, or gradients.
- Typography: Bold editorial headlines, deliberate typographic hierarchy, generous whitespace.
- Public-facing privacy: Never disclose AI coding tools, agents, or internal development methods in copy.

## Commands
- Dev server: `npm run dev`
- Type check: `npx tsc --noEmit`
- Production build: `npm run build`
- Preview build: `npm run preview`

## Tech Stack
- React 18 + TypeScript
- Vite 5
- Tailwind CSS v4 (`@tailwindcss/vite`)

## Source Structure
- `src/components/Header.tsx`: Fixed header with dropdown on Services (AI Automation + Web Design & Dev), mobile accordion nav.
- `src/components/Hero.tsx`: Editorial hero with dual service quick-links and CTAs.
- `src/components/Services.tsx`: Two equal service pillars with capability breakdowns.
- `src/components/AutomationWork.tsx`: AI automation case study catalogue with detail modal (Challenge, Solution, Workflow Image).
- `src/components/WebDesignSection.tsx`: Interactive website screenshot carousel and fullscreen lightbox viewer with arrow navigation.
- `src/components/Process.tsx`: 6-step delivery process.
- `src/components/About.tsx`: Bio and technology overview.
- `src/components/Contact.tsx`: Validated contact form and direct verified links (Email, GitHub, LinkedIn, TikTok).
- `src/components/Footer.tsx`: Footer navigation and social links.

