import type { Config } from "tailwindcss";
import { getChaiBuilderTheme } from "@chaibuilder/sdk/tailwind";
import chaiConfig from "./chai.config.json";

const config: Config = {
  darkMode: "class",
  content: {
    files: [
      "./pages/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
      "./app/**/*.{js,ts,jsx,tsx,mdx}",

      // Chai Builder
      "./blocks/**/*.{js,ts,jsx,tsx,mdx}",
      "./chai/**/*.chai",
    ],
    extract: {
      chai: (content) =>
        content.replace(/#styles:/g, "").match(/[A-Za-z0-9-_:/\[\]]+/g) || [],
    },
  },
  safelist: ["absolute", "inset-0", "w-full", "h-full"],
  theme: { extend: getChaiBuilderTheme(chaiConfig.theme as any) },
  plugins: [],
};
export default config;
