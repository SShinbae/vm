import { ScrollViewStyleReset } from "expo-router/html";
import { darkTheme, lightTheme } from "@/src/design-system";

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        {/* SEO Meta Tags */}
        <meta
          name="description"
          content="Track expenses, monitor mileage, analyze fuel consumption, and generate comprehensive reports for your vehicles — all in one powerful platform."
        />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content={lightTheme.colors.primary} />
        <link rel="canonical" href="https://vm.wanahnaf.dev" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vm.wanahnaf.dev" />
        <meta property="og:title" content="Vehicle Management System" />
        <meta
          property="og:description"
          content="Track expenses, monitor mileage, analyze fuel consumption, and generate comprehensive reports for your vehicles."
        />
        <meta
          property="og:image"
          content="https://vm.wanahnaf.dev/og-image.png"
        />
        <meta property="og:site_name" content="Vehicle Management" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Vehicle Management System" />
        <meta
          name="twitter:description"
          content="Track expenses, monitor mileage, analyze fuel consumption, and generate comprehensive reports for your vehicles."
        />
        <meta
          name="twitter:image"
          content="https://vm.wanahnaf.dev/og-image.png"
        />
        <ScrollViewStyleReset />
        {/* Inline dark-mode background so the page is never white/black before JS loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@media(prefers-color-scheme:dark){html,body{background-color:${darkTheme.colors.background};color:${darkTheme.colors.text}}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
