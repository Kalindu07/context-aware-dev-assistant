import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fileExtensionOf,
  hashPath,
  normalisePathForHash,
} from "../../src/privacy/pathHash";

describe("pathHash", () => {
  it("normalises Windows separators and drive letter", () => {
    assert.equal(
      normalisePathForHash("C:\\Users\\Ada\\proj\\a.ts"),
      "c:/Users/Ada/proj/a.ts",
    );
  });

  it("produces stable HMAC digests without embedding the raw path", () => {
    const secret = "a".repeat(64);
    const digest = hashPath("D:\\work\\secret-project\\main.py", secret);
    assert.equal(digest.length, 64);
    assert.match(digest, /^[0-9a-f]+$/);
    assert.equal(digest.includes("secret-project"), false);
    assert.equal(digest.includes("D:"), false);
    assert.equal(
      hashPath("D:\\work\\secret-project\\main.py", secret),
      digest,
    );
  });

  it("extracts short file extensions only", () => {
    assert.equal(fileExtensionOf("C:\\a\\b\\file.test.ts"), ".ts");
    assert.equal(fileExtensionOf("/tmp/Makefile"), undefined);
  });
});
