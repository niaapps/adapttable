# Dependency patches

## braces 3.0.3

`micromatch` resolves this package. The published 3.0.3 release is affected by
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
(CVE-2026-93687); no patched npm release was available on 2026-10-11.

The pnpm patch stops brace parsing, expansion and compilation once nesting
passes 100. A caller cannot raise that cap. Ordinary glob patterns are
unchanged. `scripts/braces-depth.test.mjs` uses an explicit development fixture, so the
guard fails if the patch is missing from the installed graph.

The version remains 3.0.3, so Dependabot may still report the advisory. It is
not dismissed. Replace this patch with a verified upstream release when one
exists.

## sprintf-js 1.1.3

The API Extractor and coverage tooling both resolve this package through
`argparse`. All consumers are upgraded to the current 1.1.3 release using a
pnpm override. [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
(CVE-2026-97058) still has no fixed npm release as of 2026-10-11.

The source patch bounds `e`, `f` and `g` precision at 100 before numeric
formatting. `scripts/sprintf-js-precision.test.mjs` resolves both real tooling
consumers and verifies ordinary formatting and hostile precision. There is no
extra root dependency solely for that test.

Dependabot can still flag 1.1.3 because it does not account for source patches.
The alert is not dismissed. Replace the patch with a verified upstream fix
when available.

## http-cache-semantics 4.3.0

Astro's image/cache tooling is upgraded to 4.3.0 through a pnpm override. This
retains the upstream Vary/prototype fixes and response status API. However,
the published 4.3.0 source still fails the stale-reuse regression tests for
[GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp)
(CVE-2026-93748), so a source patch remains necessary.

The patch prevents `max-stale`, `stale-if-error`, or `stale-while-revalidate`
from bypassing response reuse restrictions. Shared cookie responses without
public/immutable opt-in, proxy-revalidate, no-cache, non-storable and wildcard
Vary responses require validation. Mandatory validation and shared s-maxage
also prevent stale reuse. Error fallback checks the request URL, method,
Host and cache directives. Permitted private caches and stale reuse remain
supported; the API and serialized policy format remain unchanged.

`scripts/http-cache-semantics.test.mjs` resolves through Astro and checks both
original and serialized/restored policies. An unpatched 4.3.0 fails 25 of its
30 tests; the patched consumer passes all 30. The advisory's version range
alone must not be used as evidence that this source is fixed.
