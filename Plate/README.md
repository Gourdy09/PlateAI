# Plate

Plate is a cooking app: swipe through recipe ideas, keep track of what is in your
fridge, and cook with an assistant that answers questions out loud while your hands
are busy.

The repository holds two services:

| Path      | What it is                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| `Plate/`  | The React Native app (Expo SDK 57, expo-router). This directory.               |
| `server/` | The Node.js API. Owns MongoDB, Gemini, ElevenLabs, and grocery providers.      |

Every AI feature and every database read or write goes through the API. The app
holds no service credentials: Gemini, ElevenLabs, MongoDB, and Unsplash keys live
only in `server/.env`, and the app authenticates to the API with an Auth0 access
token.

## Architecture

```
React Native (Expo)  ──HTTPS──▶  Node.js API  ──▶  MongoDB      (source of truth)
        │                             ├──▶  Gemini        (recipes, chat, vision)
        │                             ├──▶  ElevenLabs    (speech to text, text to speech)
        │                             └──▶  grocery provider (optional, none built in)
        └──OAuth (PKCE)──▶ Auth0
```

- **Gemini** is the only general-purpose AI. **ElevenLabs** is the only voice
  provider. **MongoDB** is the only source of truth. **Auth0** is the only identity
  system — Plate never stores passwords.
- The API derives the user from the verified Auth0 token, never from a client-supplied
  id, so one account cannot read another's documents.
- Allergies are enforced twice: they are sent to Gemini as hard constraints, and every
  generated recipe is re-checked on the server before it is returned. A recipe that
  fails is regenerated rather than shown.

## Running it

Both services need to be running. Start with the backend.

### 1. API

```bash
cd server
npm install
cp .env.example .env   # then fill it in
npm run dev
```

`GET /health` reports which integrations are configured. The API starts even with
keys missing, and the app then shows those features as unavailable instead of
pretending they work.

Required: `MONGODB_URI`, `AUTH0_DOMAIN`.
Strongly recommended: `AUTH0_AUDIENCE` (local token verification), `GEMINI_API_KEY`
(all AI features), `ELEVENLABS_API_KEY` (voice).
Optional: `UNSPLASH_ACCESS_KEY` for recipe photography.

### 2. App

```bash
npm install
cp .env.example .env   # then fill it in
npx expo start
```

`EXPO_PUBLIC_API_URL` can be left empty on a dev machine: the app derives the API
host from the Expo dev server, which is what a physical device on the same network
needs. Set it explicitly against a deployed backend.

`EXPO_PUBLIC_AUTH0_AUDIENCE` must match `AUTH0_AUDIENCE` on the server.

Voice recording, the camera, and Auth0's redirect need a development build rather
than Expo Go:

```bash
npx expo run:android   # or: npx expo run:ios
```

### Auth0 setup

Create a **Native** application and add these callback and logout URLs:

```
plate://redirect, exp://127.0.0.1:8081/--/redirect, http://localhost:8081/redirect
```

Then create an API whose identifier matches `AUTH0_AUDIENCE`. Enable the
`Username-Password-Authentication` database connection for email sign-in.

## What is inside the app

- `src/app` — expo-router routes. `(auth)` for sign-in, `(app)` for everything behind
  the session, with `Discover / Saved / Cart / You` tabs and stack screens for recipe
  details, cooking mode, chat, fridge, preferences, and settings.
- `src/api` — typed API client and the react-query hooks each screen reads from.
- `src/ctx` — auth session, query cache, theme, voice, and toasts.
- `src/components` — the shared UI kit (`ui/`) plus recipe, chat, and cooking pieces.
- `src/constants/theme.ts` — every colour, radius, and type token. Components read
  from here; none hardcode colours, which is what makes light and dark work.

Light and dark follow the phone's appearance by default; Settings can pin either.

## Honesty rules this codebase follows

These are deliberate and worth keeping:

- A card leaves the swipe deck only after MongoDB has stored the swipe. A failed
  write springs the card back and says so.
- Recipe photos appear only when the backend found a real photo for that dish.
  Otherwise Plate draws its own cover rather than showing a stock photo of a
  different meal.
- "Hey Plate" wake-word listening is **not** implemented. `GET /voice/status`
  reports it as unsupported and the app repeats that verbatim; the microphone
  button is the real trigger.
- No grocery provider ships with Plate, so prices, stock, delivery times, and
  orders are never invented. The cart says what is unavailable and offers no
  ordering until a provider is implemented behind
  `server/src/services/providers/`.
- Nutrition is labelled as an estimate, and fields the model did not provide are
  omitted rather than guessed.

## Checks

```bash
npx tsc --noEmit   # types
npx expo lint      # lint, including the React Compiler rules
```
