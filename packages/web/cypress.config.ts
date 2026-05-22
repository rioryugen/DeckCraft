// Author: RioRyuGen
// Date: 2026-05-22
// Revision: 1.0.0

import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
