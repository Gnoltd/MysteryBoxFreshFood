# MysteryBox Design Sync — Notes

## Windows `echo` quoting bug

The `build:lib` npm script originally used `echo ... > file` to write `dist-lib/index.d.ts`. On Windows, `cmd.exe` wraps the echo output in literal quote characters, producing:

```
"export * from './src/components/index';"
```

This is not valid TypeScript. `ts-morph`'s `getExportedDeclarations()` returns nothing when it parses a quoted string literal instead of an export statement, causing `[ZERO_MATCH]` (0 components detected).

**Fix applied:** `build:lib` now uses `node -e "require('fs').writeFileSync(...)"` instead of `echo`. See `package.json`.

## Nested `MysteryBoxProvider` crash

The preview HTML mount wraps every story export in `window.MysteryBox.MysteryBoxProvider` externally:

```js
ReactDOM.createRoot(r).render(h(window.MysteryBox.MysteryBoxProvider, {}, h(window.__dsPreview[key])))
```

This means authored preview files in `.design-sync/previews/` must NOT also wrap their JSX in `<MysteryBoxProvider>`. If they do, React Router v7 throws:

```
Error: You cannot render a <Router> inside another <Router>.
```

...which leaves the preview card root (`#g`) empty.

**Rule:** Preview files export plain JSX — no `MysteryBoxProvider` wrapper. The router and i18n context are provided by the outer mount.

## Components excluded from sync

These components are app-shell / infrastructure only and are excluded via `componentSrcMap: null` in `.design-sync/config.json`:

- `ProtectedRoute`, `RoleRoute` — auth guards, no visual output
- `AuthLayout`, `CustomerLayout`, `VendorLayout` — full-page shells
- `NotificationPanel`, `ReviewsCarousel` — require complex live Firebase state
- `LanguageToggle` — single icon button, not a meaningful design primitive
- `MysteryBoxProvider` — the provider itself; used externally by the mount

## Card mode overrides

- `Card`, `ListingCard`, `MysteryCard` — use `cardMode: "column"` to avoid grid overflow (these components are naturally wide)
- `GlassNav` — uses `cardMode: "single"` + `primaryStory: "HomeNav"` because it uses `position: fixed` which escapes the grid container
