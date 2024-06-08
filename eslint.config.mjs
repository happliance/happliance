import unjs from "eslint-config-unjs";
import prettier from "eslint-plugin-prettier/recommended";

export default unjs(
  {
    rules: {
      // "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  prettier,
);
