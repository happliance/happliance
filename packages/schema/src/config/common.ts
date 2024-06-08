import { existsSync } from "node:fs";
import { relative, resolve } from "pathe";
import { findWorkspaceDir } from "pkg-types";
import { isDebug, isDevelopment, isTest } from "std-env";
import { randomUUID } from "uncrypto";
import { defineUntypedSchema } from "untyped";

export default defineUntypedSchema({
  /**
   * Define the root directory of your application.
   *
   * This property can be overwritten (for example, running `happliance ./my-app/`
   * will set the `rootDir` to the absolute path of `./my-app/` from the
   * current/working directory.
   *
   * It is normally not needed to configure this option.
   */
  rootDir: {
    $resolve: (val: string | undefined) => {
      return typeof val === "string" ? resolve(val) : process.cwd();
    },
  },

  /**
   * Define the workspace directory of your application.
   *
   * Often this is used when in a monorepo setup. Happliance will attempt to detect
   * your workspace directory automatically, but you can override it here.
   *
   * It is normally not needed to configure this option.
   */
  workspaceDir: {
    $resolve: async (val: string | undefined, get): Promise<string> => {
      const rootDir = <string>await get("rootDir");
      return val ? resolve(rootDir, val) : await findWorkspaceDir(rootDir).catch(() => rootDir);
    },
  },

  /**
   * Define the source directory of your Happliance application.
   *
   * If a relative path is specified, it will be relative to the `rootDir`.
   * @example
   * ```js
   * export default {
   *   srcDir: 'src/'
   * }
   * ```
   * This would work with the following folder structure:
   * ```bash
   * -| app/
   * ---| node_modules/
   * ---| happliance.config.js
   * ---| package.json
   * ---| src/
   * ------| assets/
   * ------| controllers/
   * ------| public/
   * ------| services/
   * ------| app.config.ts
   * ------| app.ts
   * ```
   */
  srcDir: {
    $resolve: async (val: string | undefined, get): Promise<string> => {
      const rootDir = <string>await get("rootDir");
      if (val) return resolve(rootDir, val);

      const srcDir = resolve(rootDir, "app");

      if (!existsSync(srcDir)) {
        for (const file of ["app.ts"]) {
          // TODO add more files
          if (existsSync(resolve(rootDir, file))) return rootDir;
        }

        const keys = ["plugins"]; // TODO add more keys
        const dirs = await Promise.all(keys.map((key) => <Promise<string>>get(`dir.${key}`)));

        for (const dir of dirs) {
          if (existsSync(resolve(rootDir, dir))) return rootDir;
        }
      }

      return srcDir;
    },
  },

  /**
   * Define the directory where your built Happliance files will be placed.
   *
   * Many tools assume that `.happ` is a hidden directory (because it starts
   * with a `.`). If that is a problem, you can use this option to prevent that.
   * @example
   * ```js
   * export default {
   *   buildDir: 'happliance-build'
   * }
   * ```
   */
  buildDir: {
    $resolve: async (val: string | undefined, get): Promise<string> => resolve(<string>await get("rootDir"), val || ".happ"),
  },

  /**
   * For multi-app projects, the unique name of the Happliance application.
   */
  appId: {
    $resolve: (val: string) => val ?? "happliance-app",
  },

  /**
   * A unique identifier matching the build. This may contain the hash of the current state of the project.
   */
  buildId: {
    $resolve: async (val: string | undefined, get): Promise<string> => {
      if (typeof val === "string") return val;

      const [isDev, isTest] = await Promise.all([<Promise<boolean>>get("dev"), <Promise<boolean>>get("test")]);
      return isDev ? "dev" : isTest ? "test" : randomUUID();
    },
  },

  /**
   * Used to set the modules directories for path resolving (for example, webpack's
   * `resolveLoading`, `nodeExternals` and `postcss`).
   *
   * The configuration path is relative to `options.rootDir` (default is current working directory).
   *
   * Setting this field may be necessary if your project is organized as a yarn workspace-styled mono-repository.
   * @example
   * ```js
   * export default {
   *   modulesDir: ['../../node_modules']
   * }
   * ```
   */
  modulesDir: {
    $default: ["node_modules"],
    $resolve: async (val: string[] | undefined, get): Promise<string[]> => {
      const rootDir = (await get("rootDir")) as string;
      return [...new Set([...(val || []).map((dir: string) => resolve(rootDir, dir)), resolve(rootDir, "node_modules")])];
    },
  },

  /**
   * Whether Happliance is running in development mode.
   *
   * Normally, you should not need to set this.
   */
  dev: {
    $resolve: (val) => val ?? isDevelopment,
  },

  /**
   * Whether your app is being unit tested.
   */
  test: {
    $resolve: (val) => val ?? isTest,
  },

  /**
   * Set to `true` to enable debug mode.
   */
  debug: {
    $resolve: (val) => val ?? isDebug,
  },

  /**
   * Modules are Happliance extensions which can extend its core functionality and add endless integrations.
   *
   * Each module is either a string (which can refer to a package, or be a path to a file), a
   * tuple with the module as first string and the options as a second object, or an inline module function.
   *
   * Happliance tries to resolve each item in the modules array using node require path
   * (in `node_modules`) and then will be resolved from project `srcDir` if `~` alias is used.
   * @note Modules are executed sequentially so the order is important. First, the modules defined in `happliance.config.ts` are loaded. Then, modules found in the `modules/`
   * directory are executed, and they load in alphabetical order.
   * @example
   * ```js
   * modules: [
   *   // Using package name
   *   '@happliance/typeorm',
   *   // Relative to your project srcDir
   *   '~/modules/awesome.js',
   *   // Providing options
   *   ['@happliance/authjs', { secret: '!MySecret!' }],
   *   // Inline definition
   *   function () {}
   * ]
   * ```
   * @type {(typeof import('../src/types/module').HapplianceModule | string | [typeof import('../src/types/module').HapplianceModule | string, Record<string, any>] | undefined | null | false)[]}
   */
  modules: {
    $resolve: (val: string[] | undefined): string[] => (val || []).filter(Boolean),
  },

  /**
   * Customize default directory structure used by Happliance.
   *
   * It is better to stick with defaults unless needed.
   */
  dir: {
    app: {
      $resolve: async (val: string | undefined, get): Promise<string> => {
        return resolve(<string>await get("srcDir"), val || ".");
      },
    },

    /**
     * The modules directory, each file in which will be auto-registered as a Happliance module.
     */
    modules: {
      $resolve: async (val: string | undefined, get): Promise<string> => {
        return resolve(<string>await get("rootDir"), val || "modules");
      },
    },

    /**
     * The assets directory (aliased as `~assets` in your build).
     */
    assets: "assets",

    /**
     * The plugins directory, each file of which will be auto-registered as a Happliance plugin.
     */
    plugins: "plugins",

    /**
     * The services directory, each file of which will be auto-registered as a Happliance service.
     */
    services: "services",

    /**
     * The directory which will be processed to auto-generate your application controllers.
     */
    controllers: "controllers",

    /**
     * The directory containing your static files, which will be directly accessible via the Happliance server
     * and copied across into your `dist` folder when your app is generated.
     */
    public: {
      $resolve: async (val: string | undefined, get): Promise<string> => {
        return resolve(<string>await get("rootDir"), val || "public");
      },
    },
  },

  /**
   * The extensions that should be resolved by the Happliance resolver.
   */
  extensions: {
    $resolve: (val: string[] | undefined): string[] => [".js", ".jsx", ".mjs", ".ts", ".tsx", ...(val || [])].filter(Boolean),
  },

  /**
   * You can improve your DX by defining additional aliases to access custom directories
   * within your JavaScript and CSS.
   * @note Within a webpack context (image sources, CSS - but not JavaScript) you _must_ access
   * your alias by prefixing it with `~`.
   * @note These aliases will be automatically added to the generated `.happ/tsconfig.json` so you can get full
   * type support and path auto-complete. In case you need to extend options provided by `./.happ/tsconfig.json`
   * further, make sure to add them here or within the `typescript.tsConfig` property in `happliance.config`.
   * @example
   * ```js
   * export default {
   *   alias: {
   *     'images': fileURLToPath(new URL('./assets/images', import.meta.url)),
   *     'style': fileURLToPath(new URL('./assets/style', import.meta.url)),
   *     'data': fileURLToPath(new URL('./assets/other/data', import.meta.url))
   *   }
   * }
   * ```
   *
   * ```html
   * <template>
   *   <img src="~images/main-bg.jpg">
   * </template>
   *
   * <script>
   * import data from 'data/test.json'
   * </script>
   *
   * <style>
   * // Uncomment the below
   * //@import '~style/variables.scss';
   * //@import '~style/utils.scss';
   * //@import '~style/base.scss';
   * body {
   *   background-image: url('~images/main-bg.jpg');
   * }
   * </style>
   * ```
   * @type {Record<string, string>}
   */
  alias: {
    $resolve: async (val: Record<string, string>, get): Promise<Record<string, string>> => {
      const [srcDir, rootDir] = (await Promise.all([get("srcDir"), get("rootDir")])) as [string, string];
      return {
        "~": srcDir,
        "~~": rootDir,
        ...val,
      };
    },
  },

  /**
   * Pass options directly to `node-ignore` (which is used by Happliance to ignore files).
   * @see [node-ignore](https://github.com/kaelzhang/node-ignore)
   * @example
   * ```js
   * ignoreOptions: {
   *   ignorecase: false
   * }
   * ```
   * @type {typeof import('ignore').Options}
   */
  ignoreOptions: undefined,

  /**
   * Any file in `pages/`, `layouts/`, `middleware/`, and `public/` directories will be ignored during
   * the build process if its filename starts with the prefix specified by `ignorePrefix`. This is intended to prevent
   * certain files from being processed or served in the built application.
   * By default, the `ignorePrefix` is set to '-', ignoring any files starting with '-'.
   */
  ignorePrefix: {
    $resolve: (val) => val ?? "-",
  },

  /**
   * More customizable than `ignorePrefix`: all files matching glob patterns specified
   * inside the `ignore` array will be ignored in building.
   */
  ignore: {
    $resolve: async (val: string[] | undefined, get): Promise<string[]> => {
      const [rootDir, ignorePrefix, buildDir] = (await Promise.all([get("rootDir"), get("ignorePrefix"), get("buildDir")])) as [string, string, string];
      return [
        "**/*.{spec,test}.{js,cts,mts,ts,jsx,tsx}",
        "**/*.d.{cts,mts,ts}",
        "**/.{pnpm-store,vercel,netlify,output,git,cache,data}",
        relative(rootDir, buildDir),
        ignorePrefix && `**/${ignorePrefix}*.*`,
        ...(val || []),
      ].filter(Boolean);
    },
  },

  /**
   * Hooks are listeners to Happliance events that are typically used in modules,
   * but are also available in `happliance.config`.
   *
   * Internally, hooks follow a naming pattern using colons (e.g., build:done).
   *
   * For ease of configuration, you can also structure them as an hierarchical
   * object in `happliance.config` (as below).
   * @example
   * ```js
   * import fs from 'node:fs'
   * import path from 'node:path'
   * export default {
   *   hooks: {
   *     build: {
   *       done(builder) {
   *         const extraFilePath = path.join(
   *           builder.happliance.options.buildDir,
   *           'extra-file'
   *         )
   *         fs.writeFileSync(extraFilePath, 'Something extra')
   *       }
   *     }
   *   }
   * }
   * ```
   * @type {typeof import('../src/types/hooks').HapplianceHooks}
   */
  hooks: undefined,

  /**
   * Additional app configuration
   *
   * For programmatic usage and type support, you can directly provide app config with this option.
   * It will be merged with `app.config` file as default value.
   * @type {typeof import('../src/types/config').AppConfig}
   */
  appConfig: {
    happliance: {},
  },

  $schema: {},
});
