export type Locale = "en" | "uk";

export const localeStorageKey = "psylex-locale";

type Copy = {
  headline: string;
  headlineAccent: string;
  subheadline: string;
  start: string;
  mediators: string;
  login: string;
  win1: string;
  win2: string;
  win3: string;
  winFooter: string;
  rolesTitle: string;
  rolesSubtitle: string;
  roles: { title: string; body: string }[];
  howTitle: string;
  modeA: string;
  modeB: string;
  modeASteps: { title: string; body: string }[];
  modeBSteps: { title: string; body: string }[];
  disclaimer: string;
  landingUplCardLead: string;
  landingUplCardBody: string;
  uplBannerLead: string;
  uplBannerBody: string;
  footerCompany: string;
  footerFounder: string;
  footerPatent: string;
  footerDemoLanding: string;
  footerDemoModeA: string;
  footerDemoModeB: string;
  footerLinks: { disclaimer: string; privacy: string; howItWorks: string };
  signInTitle: string;
  signInSubtitle: string;
  loginLabel: string;
  passwordLabel: string;
  showPassword: string;
  hidePassword: string;
  signInButton: string;
  signInLoading: string;
  backToStart: string;
  backToLanding: string;
  invalidCredentials: string;
  invalidLoginFormat: string;
  magicLinkMissingToken: string;
  magicLinkInvalid: string;
};

export const copy: Record<Locale, Copy> = {
  en: {
    headline: "Conflict doesn't need a winner.",
    headlineAccent: "It needs a solution.",
    subheadline: "AI helps both sides find what they really need — together.",
    start: "Start on my own",
    mediators: "For Mediators →",
    login: "Login",
    win1: "Side A gets what they truly need.",
    win2: "Side B gets what they truly need.",
    win3: "Agreement is real and signed.",
    winFooter:
      '"Mediation is not a compromise for the sake of compromise. It is a search for a solution where each party receives what is important."',
    rolesTitle: "Everyone has a role",
    rolesSubtitle: "PsyLex supports the process — people make the decisions.",
    roles: [
      {
        title: "The parties",
        body: "Share their story and needs, and decide on the agreement themselves.",
      },
      {
        title: "The mediator",
        body: "In mediator mode, leads the process, confirms legal information and keeps it fair.",
      },
      {
        title: "The attorney",
        body: "Gives legal advice when a party needs it. PsyLex refers parties to licensed attorneys.",
      },
    ],
    howTitle: "How It Works",
    modeA: "Mode A: Self-Resolution",
    modeB: "Mode B: For Mediators",
    modeASteps: [
      {
        title: "Initial Assessment",
        body: "Describe your conflict and take a short test to help AI understand the context.",
      },
      {
        title: "AI Dialogue",
        body: "AI creates a profile and starts a structured dialogue to uncover underlying needs.",
      },
      {
        title: "Resolution Plan",
        body: "Get a resolution plan that you can present to the other party for final agreement.",
      },
    ],
    modeBSteps: [
      {
        title: "Setup & Intake",
        body: "The mediator takes a test and adds both parties to the secure digital workspace.",
      },
      {
        title: "Psychological Analysis",
        body: "AI analyzes the psychological profiles of all three and warns about potential risks.",
      },
      {
        title: "Guided Session",
        body: "The mediator conducts the session with AI support and receives a comprehensive report.",
      },
    ],
    disclaimer: "PsyLex provides general information only. Not legal advice. Not therapy.",
    landingUplCardLead: "Legal information, not legal advice.",
    landingUplCardBody:
      " PsyLex provides legal information only, not legal services. Every legal statement cites its source with an “information as of 2024–2025” note; a mediator confirms relevance before parties see it, and parties are referred to a licensed attorney for advice.",
    uplBannerLead: "Legal information, not legal advice.",
    uplBannerBody:
      'Every legal statement in this demo cites its source; where no source is loaded, the system says "no relevant provision found."',
    footerCompany: "AI Innovation Management LLC",
    footerFounder: "Kateryna Klymenko",
    footerPatent: "Patent Pending 64/088,425",
    footerDemoLanding: "2026 · Demo",
    footerDemoModeA: "2026 · Demo Mode A",
    footerDemoModeB: "2026 · Demo Mode B",
    footerLinks: { disclaimer: "Disclaimer", privacy: "Privacy", howItWorks: "How it works" },
    signInTitle: "Sign in",
    signInSubtitle: "Sign in to access your PsyLex mediation portal",
    loginLabel: "Login",
    passwordLabel: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    signInButton: "Sign in",
    signInLoading: "Signing in…",
    backToStart: "Back to start",
    backToLanding: "← Back to landing page",
    invalidCredentials: "Invalid credentials",
    invalidLoginFormat: "Invalid login format",
    magicLinkMissingToken: "Magic link is missing a token.",
    magicLinkInvalid: "This magic link is invalid or has expired.",
  },
  uk: {
    headline: "У спорі не повинно бути тих, хто програв",
    headlineAccent: "",
    subheadline: "AI допомагає обом сторонам знайти те, що їм справді потрібно",
    start: "Почати самостійно",
    mediators: "Для медіаторів →",
    login: "Увійти",
    win1: "Сторона A отримує те, що їй справді потрібно.",
    win2: "Сторона B отримує те, що їй справді потрібно.",
    win3: "Угода реальна та підписана.",
    winFooter:
      "«Медіація — це не компроміс заради компромісу. Це пошук рішення, де кожна сторона отримує те, що для неї важливо.»",
    rolesTitle: "У кожного своя роль",
    rolesSubtitle: "PsyLex підтримує процес — рішення ухвалюють люди.",
    roles: [
      {
        title: "Сторони",
        body: "Розповідають свою історію та потреби і самі ухвалюють рішення щодо угоди.",
      },
      {
        title: "Медіатор",
        body: "У режимі з медіатором веде процес, підтверджує правову інформацію та стежить за справедливістю.",
      },
      {
        title: "Адвокат",
        body: "Надає юридичну консультацію, коли вона потрібна стороні. PsyLex направляє сторони до ліцензованих адвокатів.",
      },
    ],
    howTitle: "Як це працює",
    modeA: "Режим A: Самостійно",
    modeB: "Режим B: Для медіаторів",
    modeASteps: [
      {
        title: "Початкова оцінка",
        body: "Опишіть конфлікт і пройдіть короткий тест, щоб AI зрозумів контекст.",
      },
      {
        title: "AI діалог",
        body: "AI створює профіль і запускає структурований діалог для виявлення справжніх потреб.",
      },
      {
        title: "План врегулювання",
        body: "Отримайте план врегулювання, який можна запропонувати іншій стороні.",
      },
    ],
    modeBSteps: [
      {
        title: "Налаштування",
        body: "Медіатор проходить тест і додає обидві сторони до захищеного робочого простору.",
      },
      {
        title: "Психологічний аналіз",
        body: "AI аналізує психологічні профілі всіх трьох учасників і показує ризики.",
      },
      {
        title: "Керована сесія",
        body: "Медіатор проводить сесію з підтримкою AI і отримує звіт.",
      },
    ],
    disclaimer: "PsyLex надає лише загальну інформацію. Це не юридична порада і не терапія.",
    landingUplCardLead: "Правова інформація, а не юридична порада.",
    landingUplCardBody:
      " PsyLex надає лише правову інформацію, а не юридичні послуги. Кожне правове твердження цитує джерело з приміткою “information as of 2024–2025”; медіатор підтверджує релевантність до того, як її побачать сторони, а для отримання поради сторони скеровуються до ліцензованого адвоката.",
    uplBannerLead: "Правова інформація, а не юридична порада.",
    uplBannerBody:
      "Кожне правове твердження в цій демонстрації має посилання на джерело; якщо джерело не завантажено, система повідомляє: «не знайдено відповідного положення».",
    footerCompany: "AI Innovation Management LLC",
    footerFounder: "Kateryna Klymenko",
    footerPatent: "Patent Pending 64/088,425",
    footerDemoLanding: "2026 · Demo",
    footerDemoModeA: "2026 · Demo Mode A",
    footerDemoModeB: "2026 · Demo Mode B",
    footerLinks: { disclaimer: "Відмова", privacy: "Конфіденційність", howItWorks: "Як це працює" },
    signInTitle: "Увійти",
    signInSubtitle: "Увійдіть, щоб отримати доступ до порталу медіації PsyLex",
    loginLabel: "Логін",
    passwordLabel: "Пароль",
    showPassword: "Показати пароль",
    hidePassword: "Приховати пароль",
    signInButton: "Увійти",
    signInLoading: "Вхід у систему…",
    backToStart: "На головну",
    backToLanding: "← На головну сторінку",
    invalidCredentials: "Невірні облікові дані",
    invalidLoginFormat: "Невірний формат логіну",
    magicLinkMissingToken: "У magic-посиланні відсутній токен.",
    magicLinkInvalid: "Це magic-посилання недійсне або прострочене.",
  },
};
