/**
 * Dictation, as a React hook — `@adapttable/ai-react`.
 *
 * Thin on purpose. The controller in `@adapttable/ai/voice` owns the browser
 * APIs, the permission states and the language choice; this subscribes to it,
 * keeps it alive for the life of the composer, and writes what it hears
 * through the caller's `setDraft` — which is the one channel voice is allowed
 * to use, so a spoken sentence becomes a draft the reader can see and fix
 * rather than a request the table has already acted on.
 *
 * It lives here rather than in `@adapttable/react` because it imports
 * `@adapttable/ai`, and that package must stay out of the base graph. The
 * chrome takes `SpeechInputHandle` — the structural shape this returns —
 * from `@adapttable/react/adapter`, which declares it without importing
 * anything.
 */
"use client";

import {
  createSpeechInput,
  readRememberedLanguage,
  rememberLanguage,
  type SpeechClip,
  type SpeechInput,
  type SpeechState,
  type VoiceOptions,
} from "@adapttable/ai/voice";
import type { SpeechInputHandle } from "@adapttable/react/adapter";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

/** How the hook is configured. @public */
export interface UseSpeechInputOptions {
  readonly voice?: VoiceOptions;
  /** The table's locale, used when no language list was given. */
  readonly locale?: string;
  /** Where heard text goes. Always the draft, never a send. */
  readonly setDraft: (text: string) => void;
  /** Where a recording goes, in backend mode. */
  readonly onClip?: (clip: SpeechClip) => void;
}

const IDLE: SpeechState = { status: "unsupported", language: "", interim: "" };

/**
 * Run dictation for one composer.
 *
 * @param options - Voice configuration and where heard text should go.
 * @returns What the composer needs, or an unavailable handle when voice is off.
 *
 * @public
 */
export function useSpeechInput(
  options: UseSpeechInputOptions
): SpeechInputHandle {
  const { voice, locale, setDraft, onClip } = options;
  // Live callbacks, so the controller is built once and still calls whatever
  // the latest render passed rather than what the first one did.
  const draftRef = useRef(setDraft);
  draftRef.current = setDraft;
  const clipRef = useRef(onClip);
  clipRef.current = onClip;

  const enabled = voice !== undefined;
  const mode = voice?.mode ?? "browser";
  // A host may construct the same language array on each render. Compare its
  // values so an active recognizer survives those equivalent configurations.
  const languagesKey = JSON.stringify(
    voice?.languages?.length ? voice.languages : [locale ?? "en-US"]
  );
  const languages = useMemo(
    () => JSON.parse(languagesKey) as readonly string[],
    [languagesKey]
  );
  const [input, setInput] = useState<SpeechInput | null>(null);
  useEffect(() => {
    if (!enabled) {
      setInput(null);
      return;
    }
    const remembered = readRememberedLanguage();
    const current = createSpeechInput({
      mode,
      languages,
      ...(remembered ? { initialLanguage: remembered } : {}),
      onDraft: (text) => draftRef.current(text),
      onClip: (clip) => clipRef.current?.(clip),
    });
    setInput(current);
    // Every effect setup owns a fresh controller. Strict Mode can clean up
    // and set up again without leaving the composer attached to a disposed one.
    return () => current.dispose();
  }, [enabled, mode, languages]);

  const state = useSyncExternalStore(
    (listener) => input?.subscribe(listener) ?? (() => undefined),
    () => input?.getState() ?? IDLE,
    () => IDLE
  );

  return {
    // Absent rather than dead: a mic that cannot listen is not drawn.
    available: Boolean(voice && input?.supported()),
    state,
    languages,
    start: () => input?.start(),
    stop: () => input?.stop(),
    setLanguage: (language) => {
      input?.setLanguage(language);
      rememberLanguage(language);
    },
  };
}
