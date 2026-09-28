import { describe, expect, it } from "vitest";
import { buildHarnessWebCommand, inspectRuntime, resolveExternalWebService } from "../src/runtime.js";

describe("Harness Web command", () => {
  it("installs the Harness package explicitly before invoking its dsh executable", () => {
    const command = buildHarnessWebCommand(
      { workspace: "/workspace", serviceHome: "/data/service" },
      {
        DSH_MCP_NPX_COMMAND: "test-npx",
        DSH_MCP_HARNESS_PACKAGE: "@deepseek-ai/dsh@test-version",
      },
    );

    expect(command.command).toBe("test-npx");
    expect(command.args).toEqual([
      "--yes",
      "--package=@deepseek-ai/dsh@test-version",
      "--",
      "dsh",
      "web",
      "--port",
      "0",
    ]);
  });

  it("uses the cross-platform npx command by default", () => {
    const command = buildHarnessWebCommand(
      { workspace: "/workspace", serviceHome: "/data/service" },
      { DSH_MCP_HARNESS_PACKAGE: "@deepseek-ai/dsh@test-version" },
    );

    expect(command.command).toBe("npx");
  });

  it.runIf(process.platform === "win32")("detects the Windows npx command shim", () => {
    const runtime = inspectRuntime(process.env);

    expect(runtime.npxAvailable).toBe(true);
    expect(runtime.npxVersion).toMatch(/^\d+\.\d+\.\d+/u);
  });

  it("rejects line breaks in executable and package configuration", () => {
    expect(() => buildHarnessWebCommand(
      { workspace: "/workspace", serviceHome: "/data/service" },
      { DSH_MCP_NPX_COMMAND: "npx\r\nwhoami" },
    )).toThrow("DSH_MCP_NPX_COMMAND must not contain line breaks");
    expect(() => buildHarnessWebCommand(
      { workspace: "/workspace", serviceHome: "/data/service" },
      { DSH_MCP_HARNESS_PACKAGE: "@deepseek-ai/dsh\nwhoami" },
    )).toThrow("DSH_MCP_HARNESS_PACKAGE must not contain line breaks");
  });

  it("uses an existing loopback Web service without requiring npx", () => {
    expect(resolveExternalWebService({ DSH_MCP_WEB_URL: "http://127.0.0.1:3080/?token=test-token" })).toEqual({
      webUrl: "http://127.0.0.1:3080",
      authenticationUrl: "http://127.0.0.1:3080/?token=test-token",
    });

    const runtime = inspectRuntime({
      DSH_MCP_WEB_URL: "http://127.0.0.1:3080",
      DSH_MCP_NPX_COMMAND: "missing-npx-command",
    });
    expect(runtime.ready).toBe(true);
    expect(runtime.externalWebUrl).toBe("http://127.0.0.1:3080");
    expect(runtime.externalWebAuthenticationConfigured).toBe(false);
    expect(runtime.npxRequired).toBe(false);
    expect(runtime.npxAvailable).toBeNull();
  });

  it("rejects non-loopback Web services", () => {
    expect(() => resolveExternalWebService({ DSH_MCP_WEB_URL: "https://example.com" })).toThrow("loopback");
  });
});
