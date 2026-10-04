import type { Metadata, Viewport } from "next";
import "@fontsource-variable/onest";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { NAME, SITE } from "@/lib/site";

const DESCRIPTION =
  "Приложение для iPhone: идёте космонавтом по другим мирам и чувствуете их гравитацию в прыжке. У каждого числа — источник и рассказ, как его измерили.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${NAME} — прогулка по мирам в их настоящей гравитации`, template: `%s — ${NAME}` },
  description: DESCRIPTION,
  openGraph: { siteName: NAME, type: "website", locale: "ru_RU", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#18191b" },
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          // Theme before first paint: a saved choice wins, else the OS. Mirrors ThemeToggle.
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('planetwalk-theme');if(t!=='dark'&&t!=='light'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <SiteNav />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
