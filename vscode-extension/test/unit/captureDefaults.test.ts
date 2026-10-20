import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.resolve(here, "../../package.json");

describe("capture defaults", () => {
  it("keeps capture opt-in (no default-on setting) and bootstrap off by default", () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const props = pkg.contributes.configuration.properties;
    assert.equal(
      props["contextAwareDevAssistant.useDevConsentBootstrap"].default,
      false,
    );
    assert.equal(
      props["contextAwareDevAssistant.backendBaseUrl"].default,
      "http://127.0.0.1:8000",
    );
    // Capture enablement is command/globalState driven, not a default-true setting.
    assert.equal(
      props["contextAwareDevAssistant.captureEnabled"],
      undefined,
    );
  });
});
