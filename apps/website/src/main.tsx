import { render } from "solid-js/web";

import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/geist-mono/wght.css";
import "./base.css";
import { App } from "./App";

render(() => <App />, document.getElementById("app")!);
