import { act, cleanup, renderHook } from "@testing-library/react";
import { type ReactNode, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useSpeechInput } from "./useSpeechInput";

class Recognizer {
  static readonly instances: Recognizer[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: { error?: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    Recognizer.instances.push(this);
  }
}
beforeEach(() => {
  Recognizer.instances.splice(0);
  vi.stubGlobal("SpeechRecognition", Recognizer);
  vi.stubGlobal("webkitSpeechRecognition", undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const voice = { mode: "browser" as const, languages: ["en"] };

describe("dictation controller lifetime", () => {
  it("survives Strict Mode's effect cleanup and recovers from permission denial", () => {
    const { result, unmount } = renderHook(
      () => useSpeechInput({ voice, setDraft: vi.fn() }),
      {
        wrapper: ({ children }: { children: ReactNode }) => (
          <StrictMode>{children}</StrictMode>
        ),
      }
    );
    expect(result.current.available).toBe(true);
    act(() => result.current.start());
    expect(Recognizer.instances).toHaveLength(1);
    expect(Recognizer.instances[0]!.start).toHaveBeenCalledOnce();
    act(() => Recognizer.instances[0]!.onerror?.({ error: "not-allowed" }));
    expect(result.current.state.status).toBe("denied");
    expect(result.current.state.error).toContain("refused");
    act(() => result.current.start());
    expect(result.current.state.status).toBe("listening");
    expect(result.current.state.error).toBeUndefined();
    unmount();
    expect(Recognizer.instances.at(-1)!.abort).toHaveBeenCalled();
  });

  it("releases disabled voice and creates a fresh recognizer when re-enabled", () => {
    const setDraft = vi.fn();
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useSpeechInput({ voice: enabled ? voice : undefined, setDraft }),
      { initialProps: { enabled: true } }
    );
    act(() => result.current.start());
    const first = Recognizer.instances[0]!;
    rerender({ enabled: false });
    expect(first.abort).toHaveBeenCalledOnce();
    expect(result.current.available).toBe(false);
    expect(result.current.state.status).toBe("unsupported");
    rerender({ enabled: true });
    act(() => result.current.start());
    expect(Recognizer.instances).toHaveLength(2);
    expect(result.current.state.status).toBe("listening");
    expect(setDraft).not.toHaveBeenCalled();
  });

  it("keeps equal offered languages stable and follows changed language configuration", () => {
    const { result, rerender } = renderHook(
      ({ language }) =>
        useSpeechInput({
          voice: { mode: "browser", languages: [language] },
          setDraft: vi.fn(),
        }),
      { initialProps: { language: "en" } }
    );
    act(() => result.current.start());
    const first = Recognizer.instances[0]!;
    rerender({ language: "en" });
    expect(first.abort).not.toHaveBeenCalled();
    expect(result.current.state.status).toBe("listening");
    rerender({ language: "fr" });
    expect(first.abort).toHaveBeenCalledOnce();
    act(() => result.current.start());
    expect(Recognizer.instances.at(-1)!.lang).toBe("fr");
  });

  it("uses the latest draft callback and releases listening when changing language", () => {
    const firstDraft = vi.fn(),
      nextDraft = vi.fn();
    const { result, rerender } = renderHook(
      ({ setDraft }) =>
        useSpeechInput({
          voice: { mode: "browser", languages: ["en", "fr"] },
          setDraft,
        }),
      { initialProps: { setDraft: firstDraft } }
    );
    act(() => result.current.start());
    const recognition = Recognizer.instances[0]!;
    rerender({ setDraft: nextDraft });
    act(() =>
      recognition.onresult?.({
        resultIndex: 0,
        results: [{ isFinal: true, 0: { transcript: "Recovered words" } }],
      })
    );
    expect(nextDraft).toHaveBeenCalledWith("Recovered words");
    expect(firstDraft).not.toHaveBeenCalled();
    act(() => result.current.stop());
    expect(recognition.stop).toHaveBeenCalled();
    act(() => result.current.setLanguage("fr"));
    expect(result.current.state.language).toBe("fr");
    act(() => result.current.start());
    expect(Recognizer.instances.at(-1)!.lang).toBe("fr");
  });

  it("renders on the server without constructing a recognizer", () => {
    function Probe() {
      const input = useSpeechInput({ voice, setDraft: vi.fn() });
      return (
        <output>
          {input.available ? "Voice available" : "Typed input available"}
        </output>
      );
    }
    expect(renderToString(<Probe />)).toContain("Typed input available");
    expect(Recognizer.instances).toHaveLength(0);
  });

  it("leaves voice unavailable when no browser recognizer exists", () => {
    vi.stubGlobal("SpeechRecognition", undefined);
    const { result } = renderHook(() =>
      useSpeechInput({ voice: {}, locale: "ar", setDraft: vi.fn() })
    );
    expect(result.current.available).toBe(false);
    expect(result.current.languages).toEqual(["ar"]);
    act(() => {
      result.current.start();
      result.current.stop();
    });
    expect(Recognizer.instances).toHaveLength(0);
  });
});
