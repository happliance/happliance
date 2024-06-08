import app from "./app";
import build from "./build";
import common from "./common";
import dev from "./dev";
import internal from "./internal";
import typescript from "./typescript";

export default {
  ...app,
  ...build,
  ...common,
  ...dev,
  ...internal,
  ...typescript,
};
