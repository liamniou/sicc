import { getChaiBuilderTailwindConfig } from "@chaibuilder/sdk/tailwind";

export default getChaiBuilderTailwindConfig([
  "./node_modules/@chaibuilder/local/dist/**/*.{js,ts,jsx,tsx,cjs,mjs}",
]);
