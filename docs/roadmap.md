# Roadmap

These are future options, not implemented features or commitments. Keep changes small and driven by actual personal use.

## Multilingual interface

When a second language is needed:

1. Move English messages into a locale dictionary and give static HTML copy stable translation keys.
2. Add complete message templates for sentence composition and plural forms. Avoid translating sentence fragments independently.
3. Translate accessibility labels, placeholders, page title and install metadata as well as visible text.
4. Add a language setting with an explicit fallback and update the document's `lang` attribute.
5. Use `Intl.DateTimeFormat` and `Intl.NumberFormat` for display while preserving stored dates and numbers.
6. Test missing keys, text expansion, form errors and mobile layouts.

Do not translate user-entered names or rewrite historical snapshots. Decide separately whether the source exercise catalog needs translated display names keyed by stable routine IDs. A localization library becomes useful if pluralization or supported locales grow complex.

## Recommendation customization

The engine currently exposes named, fixed lexicographic priorities. Before introducing settings, specify the intended tradeoffs with concrete history scenarios. Decide whether a criterion is a hard filter, an ordered preference or a weighted tradeoff. Add scenario tests before changing the policy.

Possible additions include priority presets, configurable lookback windows and user-facing reasons. If historical reproducibility becomes important, version the policy separately from backup schema versions.

## Recommendation performance

Measure on the target iPhone and larger libraries. Consider retaining only the best three candidates during enumeration, precomputing load contributions, or a Web Worker. Preserve stable tie ordering and verify against existing fixtures. Moving calculation to a server is unnecessary for these changes.

## History protection

Consider a last-export timestamp, backup reminders and a persistent-storage request where supported. Retain export/restore even if moving to IndexedDB: browser storage can still be cleared or evicted.

Automatic remote backup or device sync would justify a backend. That work also needs authentication, privacy decisions, conflict handling and offline synchronization; a hosted code repository alone does not provide it.

## Release process

Automate cache-version generation and asset discovery when the release process warrants a build step. A visible update-ready action can be added with deliberate handling of unsaved forms. Keep releases consistent so cached HTML never points to missing modules.

## Interface growth

Stay with vanilla JavaScript while screen state is easy to trace. Reconsider a framework when shared interactive state and repeated components become a maintenance problem. A framework migration should have its own measurable goal.
