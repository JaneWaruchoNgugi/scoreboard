# Bongo Quiz scoreboard

## Login and super admin setup

Everyone logs in with their name and one shared PIN when the page loads.
The PIN is stored in Firebase, never in the website code, and only the
super admin page (`/super-admin`) can change it. Changing the PIN logs every
device out. Each login is saved with the person's name and device.

One-time setup in the [Firebase console](https://console.firebase.google.com):

1. **Authentication → Sign-in method:** enable **Anonymous** and **Email/Password**.
2. **Authentication → Users → Add user:** create the super admin's email and
   password. Copy the new user's **User UID**.
3. **Realtime Database → Data:** add the key `auth/superAdmins/<that UID>`
   with the value `true` (a boolean, not text).
4. **Realtime Database → Rules:** replace the rules with the contents of
   [`database.rules.json`](database.rules.json) and click **Publish**.
   From this moment nobody can use the scoreboard until a PIN is set.
5. Open `https://<your-site>/super-admin`, sign in, and set the PIN
   (6 or more digits recommended).

### Local testing with emulators

```bash
firebase emulators:start --only database,auth   # uses database.rules.json
VITE_USE_EMULATORS=true npm run dev
```

---

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
