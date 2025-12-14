# Our Wave Grant Writing AI Tool

##Description
An AI powered grant writing assistant built by Digital Aid Seattle with Our Wave to help nonprofit teams reuse trusted language, respect funder requirements, and generate structured drafts fast.

## Problem Statement
Nonprofit staff spend hours repeating core narratives and trimming sections to fit strict word counts for each funder, leaving less time for relationship building and program delivery.

## Solution Overview
* Grant recipes capture required sections and output fields so drafts follow funder templates.
* Reusable organization content keeps mission language, program summaries, and metrics in one place for fast reuse.
* AI assisted draft generation uses Gemini through Firebase AI to produce Markdown or structured JSON for grant sections.
* Word and character limits are stored per output so prompts guide the model to stay within required lengths.
* Team collaboration runs through Firebase Auth and Firestore so recipes and drafts live in a shared workspace; exports today rely on copying generated text into your grant system.

## Who This Is For
* Nonprofit grant writers
* Executive directors
* Development teams
* Operations associates

## Tech Stack
* React with TypeScript and Vite
* Material UI via the Digital Aid Seattle component kit
* React Router for client side navigation
* Firebase Auth and Firestore for identity and data storage
* Firebase AI with Google Gemini for generation
* Vitest and Testing Library for automated tests

## Running the Project Locally
1. Install Node 18 or later and npm.
2. Install dependencies: `npm install`.
3. Create `.env.local` with your Firebase project settings and AI access keys using the Vite prefix:
   * `VITE_FIREBASE_API_KEY`
   * `VITE_FIREBASE_AUTH_DOMAIN`
   * `VITE_FIREBASE_PROJECT_ID`
   * `VITE_FIREBASE_STORAGE_BUCKET`
   * `VITE_FIREBASE_MESSAGING_SENDER_ID`
   * `VITE_FIREBASE_APP_ID`
   * `VITE_FIREBASE_MEASUREMENT_ID`
   * `VITE_AUTH_DOMAIN` for auth callbacks when required  
   Ensure the Firebase project has Generative Language API and Firebase AI enabled.
4. Start the dev server: `npm run dev`.
5. Open `http://localhost:3000` and sign in with the configured provider to load grant recipes and drafts.

## Repository Status
This is an MVP under active development and the structure or features may change as Our Wave and Digital Aid Seattle iterate.

## Open Source and Contribution
This project is open source. Please open an issue or pull request for bugs, improvements, or new nonprofit use cases.

## Acknowledgements
Built by Digital Aid Seattle with Our Wave.
