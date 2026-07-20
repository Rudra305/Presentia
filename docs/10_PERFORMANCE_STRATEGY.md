# 10 — Performance Strategy

## 1. Budgets

| Metric | Target | Enforcement |
|--------|--------|-------------|
| Cold start (Android mid-range) | ≤ 2.0 s | Perf CI job |
| JS bundle (non-ML) | ≤ 4 MB | `metro`-visualizer in CI |
| Face detect+embed p95 | ≤ 400 ms | Runtime metric + CI benchmark |
| FlashList scroll (5 k rows) | ≥ 55 fps | Manual test per release |
| Battery (30-min capture) | ≤ 5 % | Field test checklist |
| Memory (steady) | ≤ 250 MB | Profiler snapshot |

## 2. Rendering

- **FlashList everywhere** long lists appear (roster, students, reports).
- `estimatedItemSize` tuned per screen.
- Row components memoized with `React.memo` + stable keys.
- Avoid inline object/style props in list items — extract to constants or `useMemo`.

## 3. State Reads

- **Zustand selectors** with `shallow` equality — never subscribe to whole store.
- **React Query** with proper `queryKey`; use `select` to derive to avoid re-renders.
- **MMKV** for high-frequency reads (feature flags, thresholds).

## 4. Startup Optimization

- Hermes engine (default).
- Lazy-load heavy modules (`react-native-vision-camera`, TFLite) only inside capture route.
- `SplashScreen.preventAutoHideAsync()` until first paint ready.
- Deferred hydration: DB migrations run on splash; UI stays responsive.

## 5. Image Pipeline

- Student photos resized to 512×512 before storage.
- Use `expo-image` with disk cache + memory cache.
- Blurhash placeholders for perceived speed.

## 6. ML Runtime

- Frame downscale to 224×224 before inference.
- Throttle to 5 fps via a token bucket.
- Int8 quantized model where possible.
- Warm-up inference on session start (first invoke is slow).

## 7. Database

- WAL journal mode.
- Indexes covered for hot queries (see §04).
- Bulk inserts in a single transaction (`BEGIN … COMMIT`).
- Reads offloaded to worklet where feasible (Phase 2).

## 8. Animations

- Use **Reanimated 3** worklets on UI thread.
- Avoid `layoutAnimation` on large lists.
- 60 fps target; use `LayoutAnimation` sparingly.

## 9. Monitoring

- Custom `PerfLogger` sampling p50/p95/p99 for key ops (embed, KNN, DB write).
- Dev overlay (long-press two fingers) shows live counters.
- Sentry performance transactions (Phase 2 opt-in).

## 10. Anti-Patterns to Ban

- `console.log` in production (stripped via Babel plugin).
- Anonymous inline functions in `renderItem`.
- Deep prop drilling — prefer context or Zustand.
- Global re-renders from Context — split contexts by concern.
