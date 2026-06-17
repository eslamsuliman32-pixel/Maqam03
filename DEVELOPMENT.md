# Maqam OS2 Development Guide

## Overview
Maqam OS2 is a professional platform for Arab Rap engineering, linguistic analysis, and rhythmic design. It uses a hybrid architecture of local-first storage (Zustand + IndexedDB) synchronized with Cloud Firestore via a custom sync engine.

## Core Concepts

### 1. The Bar Repository
The **Bar Repository** is the user's primary database of lyrics. 
- **Type**: `Bar` (defined in `src/types/index.ts`)
- **Storage**: Managed by `useRepositoryStore` in `src/store/repositoryStore.ts`.
- **Sync**: Automatically handled by `src/services/firebaseSync.ts`.

### 2. Workshops
Workshops (like Academy 2 or Protocol Workshop) are interactive environments where users can experiment with bars.
- Bars in workshops are typically **clones** of repository bars.
- Clones in workshops track their origin via `repoId`.
- Saving in a workshop can either update the original bar or add a new one to the repository.

### 3. AI Services
Integrated via `src/services/geminiService.ts`.
- Uses Google Gemini 1.5 Flash for rapid analysis and Pro for deep semantic processing.
- Consistent error handling for Quota/Rate limits is implemented in `geminiService.callGeminiWithRetry`.

## Project Structure

- `src/components`: UI Components.
  - `academy/`: Specialized components for the Rap Academy workshop.
  - `ui/`: Reusable primitive components.
- `src/services`: Core logic (AI, Rhythmic Engine, Sync).
- `src/store`: Global state management.
- `src/types`: Unified TypeScript interfaces.
- `src/constants`: Centralized configuration and static data.

## Best Practices for Future Development

1. **State Persistence**: If adding a new global state, use the `persist` middleware with `cloudSyncStorage`.
2. **Type Safety**: Avoid `any`. Update `src/types/index.ts` for any new data structures.
3. **Arabic UI**: Ensure all user-facing text is in Arabic. Use the constants file for common phrases.
4. **Error Handling**: Use the `handleFirestoreError` pattern for any direct Firestore interactions to ensure the AI coding assistant can diagnose issues.
5. **UI Consistency**: Follow the existing "Glassmorphism" and "Cyber-Arabic" aesthetic (Dark background, gold accents, mono-fonts for data).

## Future Roadmap (TODO)
- [ ] Backend Real-time Collaboration (WebSockets).
- [ ] Export to Audio/DAW formats.
- [ ] Collaborative Lyric Editing 3.0.
- [ ] Advanced Phrasal Matching (Semantic Search).

---
*Generated for Maqam OS2 Project.*
