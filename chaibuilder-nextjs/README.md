# Chai Builder Next.js Starter

This is a template for building a [Chai Builder](https://chaibuilder.com) app with [Next.js](https://nextjs.org/).

## Getting Started

To get started, follow these steps:

1. Clone the repository:

```bash
git clone https://github.com/chaibuilder/chaibuilder-nextjs.git
```

2. Install the dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm run dev
```

4. Open Chai Builder locally in your browser.

   > ### http://localhost:3000/chai

   Page might take few seconds to load as it compiles in dev environment

5. You can now start building your pages with Chai Builder.

---

### Adding a new page

1. Create a new file in the `chai` directory with the `.chai` extension.
2. Enter the slug of the page as the file name. eg: about.chai, contact-us.chai etc
3. Go back to builder and refresh the pages list to view the new page.

---

### Previewing and live mode

Chai Builder supports both previewing and live mode.

1. Previewing: You can preview your changes by clicking the "Preview" button in the top right corner of the builder.
2. Live mode: You can see live mode by visiting the page url in browser. eg: http://localhost:3000/about

---

### Global Blocks

Global blocks are blocks that are shared across all pages.

1. Create a new file in the `chai` directory with the `.global.chai` extension. eg: header.global.chai
2. Builder will automatically detect the global blocks and show them in the builder.
3. To add a global block to page
   - Add a GlobalBlock block from add block dialog
   - From the side panel, select the global block.

---

### Registering your custom blocks

You can add your custom blocks by registering them as chai blocks.
Example reference: [Card.tsx](blocks/Card.tsx)

Once you register the block, you can view your registered block under <br />
`Add block => Blocks tab => Custom`

---

### Publishing site.

Please refer to standard Next.js documentation for publishing your site.
https://nextjs.org/docs/app/building-your-application/deploying

---

Contact us at [support@chaibuilder.com](mailto:support@chaibuilder.com) for any queries.

or join our [Discord](https://discord.gg/czkgwX2rnD) community.
