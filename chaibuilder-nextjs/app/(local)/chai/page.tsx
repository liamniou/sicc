"use client";

import dynamic from "next/dynamic";
import "@/blocks/Card";

// @ts-ignore
const ChaiBuilderLocal = dynamic(() => import("@chaibuilder/local"), {
  ssr: false,
});

export default function LocalPage() {
  if (process.env.NODE_ENV !== "development") {
    return (
      <div>
        <h1>This page is only available in development mode.</h1>
      </div>
    );
  }
  return <ChaiBuilderLocal />;
}
