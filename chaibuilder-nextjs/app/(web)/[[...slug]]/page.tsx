import fs from "fs";
import path from "path";
import { convertToBlocks, RenderChaiBlocks } from "@chaibuilder/sdk/render";
import { ChaiBlock } from "@chaibuilder/sdk";
import { loadWebBlocks } from "@chaibuilder/sdk/web-blocks";
import "@/blocks/Card";

loadWebBlocks();

const readChaiBySlug = (
  slug: string,
  defaultBlocks: ChaiBlock[] = []
): ChaiBlock[] => {
  const filePath = path.resolve(process.cwd(), "chai", `${slug}.chai`);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return convertToBlocks(data);
  } catch (error: unknown) {
    console.error(`Error reading the file: ${(error as Error).message}`);
    return defaultBlocks;
  }
};

const readChaiFile = (slug: string): ChaiBlock[] => {
  try {
    const blocks = readChaiBySlug(slug);
    const globalBlocks = blocks.filter(
      (block) => block._type === "GlobalBlock"
    );
    for (let i = 0; i < globalBlocks.length; i++) {
      const block = globalBlocks[i];
      if (block.globalBlock === "") continue;
      const globalBlockBlocks = readChaiBySlug(
        block.globalBlock + ".global",
        []
      );
      const index = blocks.indexOf(globalBlocks[i]);
      blocks.splice(index, 1, ...globalBlockBlocks);
    }
    return blocks;
  } catch (error: unknown) {
    console.error(`Error reading the file: ${(error as Error).message}`);
    return [];
  }
};

export default async function Page({ params }: { params: { slug: string[] } }) {
  const blocks = readChaiFile(params.slug ? params.slug.join("/") : "home");
  return <RenderChaiBlocks blocks={blocks} />;
}
