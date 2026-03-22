import { ScrollViewStyleReset } from "expo-router/html";

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
        <ScrollViewStyleReset />
        {/* Inline dark-mode background so the page is never white/black before JS loads */}
        <style
          dangerouslySetInnerHTML={{
            __html: `@media(prefers-color-scheme:dark){html,body{background-color:#1e292e;color:#f3f8f8}}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
