import { useState } from "react";

import type { Locale } from "./people";

/** Keep a shared feature URL's requested language on the actual native table. */
export function initialDemoLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const query = new URLSearchParams(window.location.search);
  return query.get("locale") === "ar" || query.get("dir") === "rtl"
    ? "ar"
    : "en";
}

/** Native kit providers and their portalled controls use the same direction. */
export function initialDemoDirection(): "ltr" | "rtl" {
  return initialDemoLocale() === "ar" ? "rtl" : "ltr";
}

/** Live and lab preferences are shareable and survive page/framework changes. */
export function useDemoPreference<T extends string>(
  key: "locale" | "density",
  initial: () => T
): [T, (value: T) => void] {
  const [value, setValue] = useState(initial);
  return [
    value,
    (next) => {
      const url = new URL(window.location.href);
      url.searchParams.set(key, next);
      if (key === "locale") url.searchParams.delete("dir");
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event("showcase-preferences-change"));
      setValue(next);
    },
  ];
}

export function initialDemoDensity(): "comfortable" | "compact" {
  return typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("density") === "compact"
    ? "compact"
    : "comfortable";
}
