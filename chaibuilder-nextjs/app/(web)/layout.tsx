import type { Metadata } from "next";
import localFont from "next/font/local";
import "@/app/globals.css";
import PrelineScript from "@/app/(web)/PrelineScripts";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "SICC",
  description: "Site of Stockholm International Cinema Collective",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="fa338ebd-8956-48ed-b328-d5010cbff5ef"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {children}
        <PrelineScript />
      </body>
    </html>
  );
}
