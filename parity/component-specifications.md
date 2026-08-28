# UI replica component specifications

These specifications are the remediation contract. A component is not considered
verified until its public contract, DOM behavior, interaction behavior, and visual
snapshots match canonical evidence at 1440, 768, and 390 pixels where applicable.

## Actions

Match canonical names, literals, defaults, native button/link activation, disabled
behavior, loading width, menu projection, keyboard traversal, focus return, and
dismissal. Acceptance requires click, Enter, Space, Escape, Tab, and focus tests.

## Feedback

Cover initial loading, refresh with retained data, hard error, stale-data error,
empty, ready, retry, toast timing, duplicate grouping, pause/resume, and ARIA live
announcements. Acceptance requires deterministic fake-clock and accessibility tests.

## Forms

Match value, disabled, touched, change, labels, hints, errors, synchronous and
asynchronous validation, stale-result suppression, OTP paste/navigation, upload,
and object-URL cleanup. Acceptance requires real-DOM form submission tests.

## Overlays

Match focus trap/restore, initial focus, Escape and backdrop policy, scroll
containment, nested overlays, async confirmation, and result lifecycle. Acceptance
requires keyboard-only browser journeys and cleanup assertions.

## Navigation and shell

Match route activation, query/fragment handling, breadcrumbs, tabs, responsive
navigation, mode persistence, theme persistence, and cache clearing. Acceptance
requires every matrix route at all reference viewports.

## Data components

Match table loading/empty/error/ready states, sorting, filtering, exporting, row
expansion, pagination, and stepper gating. Acceptance requires state-transition and
keyboard tests as well as visual snapshots.

## Theme and icons

Match theme precedence, storage failures, root classes, color-scheme, exact tokens,
canonical icon IDs, configurable sprite location, and one-fetch loading. Acceptance
requires computed-style tests and icon pixel snapshots.

## Core and HTTP

Match paths, payload omission rules, headers, retries, timeouts, caching,
invalidation, normalization, pagination, and validation mapping. Acceptance requires
canonical request/response differential fixtures, including edge and failure cases.
