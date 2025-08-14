# Expo Router and Tailwind CSS

Use [Expo Router](https://docs.expo.dev/router/introduction/) with [Nativewind](https://www.nativewind.dev/v4/overview/) styling.

## 🚀 How to use
```sh
npx create-expo-app -e with-tailwindcss
```

## Example Project Structure
```
my-app/
│
├── app/                      # Expo Router uses this for pages/screens
│   ├── _layout.tsx            # Main layout wrapper (navigation, headers, etc.)
│   ├── index.tsx              # Home screen
│   ├── profile/
│   │   ├── _layout.tsx        # Layout for profile subroutes
│   │   ├── index.tsx          # Profile overview screen
│   │   ├── settings.tsx       # Profile settings screen
│   ├── settings.tsx           # Standalone settings page
│   └── (auth)/                # Group for authentication
│       ├── login.tsx
│       └── register.tsx
│
├── assets/                    # Static files (images, fonts, icons, etc.)
│   ├── fonts/
│   ├── icons/
│   └── images/
│
├── components/                # Reusable UI components
│   ├── ui/                    # Generic UI (Buttons, Modals, Inputs)
│   ├── layout/                # Layout helpers (Containers, Spacers)
│   └── custom/                # App-specific components
│
├── constants/                 # Constant values, theme, configs
│   ├── colors.ts
│   ├── fonts.ts
│   └── routes.ts
│
├── hooks/                     # Reusable custom hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── useFetch.ts
│
├── services/                  # API calls, storage, external integrations
│   ├── api/
│   │   ├── client.ts          # Axios/fetch setup
│   │   └── auth.ts            # Auth-related API calls
│   ├── storage.ts             # AsyncStorage helpers
│
├── store/                     # Global state (Zustand, Redux, Jotai, etc.)
│   └── authStore.ts
│
├── utils/                     # Helper functions
│   ├── formatDate.ts
│   ├── validateEmail.ts
│   └── logger.ts
│
├── .env                       # Environment variables (API keys, etc.)
├── app.json                   # Expo config
├── package.json
└── tsconfig.json              # TypeScript config
```

## Deploy
Deploy on all platforms with Expo Application Services (EAS).

- Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
- Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)

## App Overview
- adding food
- adding drinks
- adding people

- adding food/drinks to people
- see money dept for each person
- pay dept
    - all in one
    - chosen ones / step by step

## Page Overview
- Persons-Page
- Food-Page
- Drinks-Page

### Start Page
- see all people
- add button for new people

### Person page
- see all items
- see money owed
- button for clearing dept
- button for adding new stuff
- remove single items form list not all
- details
    - see all foods/drinks listed
    - remove whole person

### Food/Drinks page
- page for food and drinks
- ability to add foods/drinks and change price/delete entry
