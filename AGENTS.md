# Nun Project Instructions

## Repositories

- **nun**: https://github.com/o9ll/nun
- **nunu**: https://github.com/o9ll/nunu
- **unu**: https://github.com/o9ll/unu
- **unun**: https://github.com/o9ll/unun

---

## Code Style

You are reviewing for **Nun**, a Discord client mod built on Equicord/Vencord. It uses TypeScript, React, and webpack patching to inject into Discord. The codebase has extensive built-in utilities. Be direct, actionable, no pleasantries. Use natural, human language. Be blunt when code is bad.

### Plugin Acceptance

1. **No simple slash-command plugins** (e.g. `/cat`). Should be a [user-installable Discord app](https://discord.com/developers/docs/change-log#userinstallable-apps-preview) instead.
2. **No raw DOM manipulation.** Always use patches and React.
3. **No plugins targeting specific third-party Discord bots.** Official Discord apps are fine.
4. **No selfbot or API abuse.** Auto-replies, animated statuses, message pruning, Nitro snipers, etc.
5. **No untrusted third-party APIs.** Well-known services (Google, GitHub) are acceptable.
6. **No new dependencies** unless strictly necessary and well justified.

### Plugin Structure

Default export via `definePlugin` from `@utils/types`.

```typescript
import definePlugin from "@utils/types";

export default definePlugin({
    name: "PluginName",             // PascalCase, matches directory name
    description: "Does something", // Capital first
});
```

**Settings** must use `definePluginSettings` from `@api/Settings`. Reject inline `options` objects.

```typescript
// GOOD
const settings = definePluginSettings({
    myOption: { type: OptionType.BOOLEAN, description: "Enables the feature.", default: true }
});
export default definePlugin({ settings, /* ... */ });

// BAD
export default definePlugin({ options: { myOption: { /* ... */ } } });
```

**Prefer declarative APIs** over manual registration:

- `flux: { EVENT_NAME(data) {} }` not manual FluxDispatcher subscribe
- `contextMenus: { "nav-id": fn }` not manual addContextMenuPatch
- `chatBarButton: { render, icon }` not addChatBarButton
- `messagePopoverButton: { render, icon }` not addMessagePopoverButton
- `managedStyle` for CSS not manual enableStyle/disableStyle

**Reject deprecated fields:** `renderChatBarButton`, `renderMessagePopoverButton`, `options`

**Lifecycle balance:** anything registered in `start()` must be cleaned up in `stop()`.

### Patterns

Flag these and suggest the fix:

| Bad | Good | Reason |
|-----|------|--------|
| `value !== null && value !== undefined` | `value` or `isNonNullish(value)` | Verbose |
| `array && array.length > 0` | `array.length` | Redundant check |
| `settings?.store?.value` | `settings.store.value` | Store is always defined |
| `value \|\| defaultValue` | `value ?? defaultValue` | `\|\|` falsifies `0`, `""`, `false` |
| `` `${classA} ${classB}` `` | `classes(classA, classB)` | Handles null/false gracefully |
| `"vc-plugin-class"` hardcoded | `cl("class")` via `classNameFactory` | Consistent, typo-proof |
| `console.log/warn` | Remove it | No logging in plugin code |
| `cdn.discordapp.com/avatars/...` | `IconUtils.getUserAvatarURL(user)` | Handles animated, sizing, CDN |
| `cdn.discordapp.com/icons/...` | `IconUtils.getGuildIconURL(...)` | Same |
| `cdn.discordapp.com/banners/...` | `IconUtils.getUserBannerURL(...)` | Same |
| `cdn.discordapp.com/emojis/...` | `IconUtils.getEmojiURL(...)` | Same |
| `/api/v9/...` or `/users/@me` | `Constants.Endpoints.*` or `RestAPI` | Endpoints change |
| `@api/Styles` for classNameFactory | `@utils/css` | `@api/Styles` is deprecated |
| `any` for Discord objects | Import from `@vencord/discord-types` | Type safety |
| `as unknown as` casting | Find the correct type | Find the correct type |
| `React.lazy(() => import(...))` | `LazyComponent` from `@utils/lazyReact` | Framework-integrated |
| Empty `catch {}` | Handle the error (toast, fallback, rethrow) | Silent failures |
| `Vencord.Plugins.plugins["X"]` | `isPluginEnabled` + direct import | Proper interop |
| `plugin.started` check | `isPluginEnabled(plugin.name)` | Proper interop |
| Unexplained magic numbers | Named constants | Readability |
| Unused imports | Remove them | Cleanliness |

### TypeScript and Code Style

**Prefer:** `?.` optional chaining, `??` nullish coalescing, `const`, arrow functions, destructuring, template literals, object shorthand, array methods (`.map`, `.filter`, `.find`, `.some`).

**Style:** early returns over nested conditions, trust TypeScript inference (don't annotate obvious types), inline single-use variables, flat over nested, explicit over implicit.

**Less is more.** Less code with the same functionality is always better. KISS over clever.

**No comments.** Never add comments unless explicitly asked. However, preserve existing comments as they contain important context.

```typescript
// GOOD — early return, destructuring, inference, no comments
const getUser = (id: string) => {
    const user = UserStore.getUser(id);
    if (!user) return null;
    const { username, discriminator } = user;
    return `${username}#${discriminator}`;
};

// BAD — nested, verbose, unnecessary annotations
function getUser(id: string): string | null {
    // Get the user from the store
    const user = UserStore.getUser(id);
    if (user) {
        const username: string = user.username;
        const discriminator: string = user.discriminator;
        return username + "#" + discriminator;
    } else {
        return null;
    }
}
```

Note: ESLint already enforces `prefer-const`, `prefer-destructuring`, `eqeqeq`, strict equality, unused imports, and import sorting. Focus review on patterns ESLint cannot catch: code philosophy, unnecessary complexity, missing early returns, and unnecessary comments.

### React

**Conditional rendering:** return `null`, never `undefined` or bare `return;`

**ErrorBoundary:** wrap complex components: `ErrorBoundary.wrap(MyComponent, { noop: true })`

**useEffect cleanup:** always return cleanup when subscribing to events, timers, or resources:

```typescript
useEffect(() => {
    const handler = () => { /* ... */ };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
}, []);
```

### Discord Types

Never use `any` for Discord objects. Import proper types:

```typescript
import { User, Channel, Guild, GuildMember, Message, Role } from "@vencord/discord-types";
```

Store types, component prop types, and action types are all available. Never use `as unknown as` casting as a workaround.

### CSS and Class Names

**Every plugin** must use `classNameFactory` from `@utils/css` for class names:

```typescript
import { classNameFactory } from "@utils/css";
const cl = classNameFactory("vc-my-plugin-");
cl("container")  // "vc-my-plugin-container"
```

**Combining classes** from different sources: use `classes()` from `@utils/misc`:

```typescript
className={classes(cl("wrapper"), someDiscordClass, isActive && cl("active"))}
```

### Settings

- `settings.store.key` — reactive, auto-persists (React components)
- `settings.plain.key` — non-reactive raw value (performance-critical code)
- **Never** `settings.use()` with arrays in variables. Mutate then reassign instead.

### Patch Quality

Patches modify Discord's minified webpack modules. Stability is paramount.

- **One patch per concern.** Each replacement does one thing.
- **Surgical.** Match only what needs replacing, let `find` target the module.
- **No hardcoded minified vars.** Never `e`, `t`, `n`, `r`, `i`, `eD`, `eH` etc. Use `\i`.
- **Bounded gaps.** `.{0,50}` not `.+?` or `.*?` (unbounded = cross-match bugs).
- **No generic patterns.** `/className:\i/` alone is too broad. Add stable anchors.
- **No raw intl hashes.** Use `#{intl::KEY_NAME}` not `.aA4Vce`.
- **Capture groups only when reused** in replace via `$1`, `$2`.
- **`$&`** for append/prepend, **`$self`** for plugin method calls.

```typescript
// GOOD
patches: [{
    find: "#{intl::PIN_MESSAGE}),icon:",
    replacement: {
        match: /#{intl::PIN_MESSAGE}\)/,
        replace: "$self.getPinLabel(arguments[0]))"
    }
}]

// BAD
patches: [{
    find: "pinMessage",
    replacement: {
        match: /label:e\.pinned\?.+?pinMessage\)/,
        replace: "$self.getPinLabel(e))"
    }
}]
```

### Plugin Interop

```typescript
// GOOD
import { isPluginEnabled } from "@api/PluginManager";
import otherPlugin from "@plugins/otherPlugin";
if (!isPluginEnabled(otherPlugin.name)) return null;
otherPlugin.someFunction();

// BAD
Vencord.Plugins.plugins["OtherPlugin"].someFunction();
(somePlugin as unknown as { method(): void }).method();
```

### Text and Descriptions

- Plugin and setting descriptions: capital first letter.
- Error messages and toasts: natural human text, no dashes or robotic formatting.

```typescript
// GOOD
description: "Adds a button to copy message content."
showToast("Module not found");

// BAD
description: "adds a button to copy message content"
showToast("Module - not found");
```

### Performance

- `Map`/`Set` for frequent lookups, not arrays
- `.find()` / `.some()` not `.filter()[0]`
- No spread `...` in loops
- `Promise.all()` for parallel async

### Memory Leaks and Cleanup

Plugins that don't use patches don't require a Discord restart to apply. Their `start()` and `stop()` must work cleanly so users can toggle them on/off without leaking resources.

**Every `start()` must have a matching `stop()`.** If `start()` subscribes, registers, or creates anything, `stop()` must undo it. Common leaks to flag:

- Event listeners added but never removed (FluxDispatcher, DOM events, MessageEvents)
- Intervals/timeouts set but never cleared
- MutationObservers created but never disconnected
- Context menu patches added but never removed (use declarative `contextMenus` instead)
- Chat bar buttons added but never removed (use declarative `chatBarButton` instead)
- Styles enabled but never disabled (use `managedStyle` instead)
- Flux subscriptions without corresponding unsubscriptions

**Prefer declarative APIs** that handle cleanup automatically: `flux`, `contextMenus`, `chatBarButton`, `messagePopoverButton`, `managedStyle`. These don't need manual cleanup.

**useEffect must return cleanup** when it creates subscriptions, timers, observers, or any persistent resource. No exceptions.

**Watch for stale closures and references.** If a plugin stores references to DOM nodes, channels, or users in module scope, check that they're nulled out in `stop()`.

```typescript
// GOOD — clean start/stop, no leaks
start() {
    this.interval = setInterval(this.update, 5000);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
},
stop() {
    clearInterval(this.interval);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
}

// BAD — leaks interval and listener forever
start() {
    setInterval(this.update, 5000);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
},
stop() {}
```

### Code Hygiene

- **Delete dead code**, don't comment it out. Git preserves history.
- **No overengineering.** No premature abstractions, no "just in case" handling, no features not requested. Three similar lines beats a one-use helper. If code can be half the size and do the same thing, it should be.
- **No bloat.** Flag unnecessary wrapper functions, redundant type annotations, excessive error handling for things that can't fail, useless try/catch around synchronous code, or 50 lines doing what 10 could do. Code should be lean.
- **No unused imports.** Every import must be referenced.
- **No logging in plugin code besides for errors.** No `console.log/warn`.

### AI Slop Detection

If a shows signs of being AI-generated, mention it but **still review the code fully**. Do not reject or stop reviewing just because it looks AI-generated. Note it as an observation, then continue reviewing every issue as you normally would. Common AI slop patterns:

- Excessive comments explaining obvious code ("// get the user", "// check if null", "// return the result")
- Overly verbose variable names that read like sentences (`isUserCurrentlyLoggedInToTheApplication`)
- Unnecessary abstractions and wrapper functions for trivial operations
- "Just in case" error handling everywhere, including places that can never fail
- Reimplementing utilities that already exist in the codebase (check the Built-in Utilities section)
- Generic, boilerplate-heavy code that looks like it was prompted with "write a Discord plugin that..."
- Excessive JSDoc/TSDoc on every function, even internal one-liners
- Overly defensive coding: null checks on things that are never null, type guards on known types
- Cookie-cutter patterns repeated without understanding (e.g. wrapping every single line in try/catch)
- Descriptions and messages that sound robotic or templated rather than human-written

If you suspect it, say something like: "This looks like it might be AI-generated. There's a lot of unnecessary comments, over-engineering, and reimplemented utilities." Then proceed with the full review, flagging every concrete issue as usual.

### Built-in Utilities Reference

If a reimplements any of these, flag it. They already exist:

**@utils/misc:** `classes`, `sleep`, `isObject`, `isObjectEmpty`, `parseUrl`, `pluralise`, `identity`
**@utils/guards:** `isTruthy`, `isNonNullish`
**@utils/text:** `formatDuration`, `formatDurationMs`, `humanFriendlyJoin`, `makeCodeblock`, `toInlineCode`, `escapeRegExp`
**@utils/discord:** `getCurrentChannel`, `getCurrentGuild`, `getIntlMessage`, `openPrivateChannel`, `insertTextIntoChatInputBox`, `sendMessage`, `copyWithToast`, `openUserProfile`, `fetchUserProfile`, `getUniqueUsername`, `openInviteModal`
**@utils/css:** `classNameFactory`, `classNameToSelector`
**@utils/clipboard:** `copyToClipboard`
**@utils/modal:** `openModal`, `closeModal`, `ModalRoot`, `ModalHeader`, `ModalContent`, `ModalFooter`, `ModalCloseButton`
**@utils/margins:** `Margins.top8`, `.top16`, `.bottom8`, `.bottom16` etc.
**@utils/web:** `saveFile`, `chooseFile`
**@utils/lazy:** `proxyLazy`, `makeLazy`
**@utils/lazyReact:** `LazyComponent`
**@utils/react:** `useAwaiter`, `useForceUpdater`, `useTimer`
**@api/DataStore:** `get`, `set`, `del` (IndexedDB, async)
**@api/Commands:** `sendBotMessage`, `findOption`

**@webpack/common:**

- Stores: `UserStore`, `GuildStore`, `ChannelStore`, `GuildMemberStore`, `SelectedChannelStore`, `SelectedGuildStore`, `PresenceStore`, `RelationshipStore`, `MessageStore`, `EmojiStore`, `ThemeStore`, `PermissionStore`, `VoiceStateStore`, 30+ more
- Actions: `RestAPI`, `FluxDispatcher`, `MessageActions`, `NavigationRouter`, `ChannelRouter`, `ChannelActionCreators`, `SettingsRouter`
- Utils: `Constants` (`.Endpoints`), `SnowflakeUtils`, `Parser`, `PermissionsBits`, `moment`, `lodash`, `IconUtils`, `ColorUtils`, `ImageUtils`, `DateUtils`, `UsernameUtils`, `DisplayProfileUtils`
- Components: `Tooltip`, `TextInput`, `TextArea`, `Select`, `Slider`, `Avatar`, `Menu`, `Popout`, `ScrollerThin`, `Timestamp`, `MaskedLink`, `ColorPicker`
- Toasts: `Toasts`, `showToast`
- React: `useState`, `useEffect`, `useCallback`, `useStateFromStores`

**@webpack finders:** `findByPropsLazy`, `findByCodeLazy`, `findStoreLazy`, `findComponentByCodeLazy`, `findExportedComponentLazy`

**@components/:** `ErrorBoundary`, `Flex`, `Button`, `Paragraph`, `Heading`, `BaseText`, `Span`, `ErrorCard`, `Link`, `CodeBlock`, `FormSwitch`

### Review Severity

1. **CRITICAL** — `any` types, hardcoded CDN/API URLs, direct DOM manipulation, security issues, massive overengineering/bloat, suspected AI slop (note it, but still review everything)
2. **HIGH** — Missing useEffect cleanup, React APIs, hardcoded class names, console logging statements, missing definePluginSettings, unnecessary abstractions
3. **MEDIUM** — Anti-patterns (`||` instead of `??`), utility reimplementations, commented-out code, bad description format, excessive comments
4. **LOW** — Style preferences, minor performance wins, organization

---

## Rules

### Philosophy

- Solve problem at hand. Follow Nun Rules to refactors.
- Smallest diff wins. Three similar lines beat premature helper.
- Less code with same behavior always wins. Equivalent solutions: shorter one ships. Compression is intelligence.
- Don't over-guard. Check only conditions that can actually occur. `if (user)` on non-optional store return is wrong. `try/catch` on code that can't throw is wrong. `?.` on type-guaranteed values is wrong. Dead defensive code isn't safety.
- Add comments only for important code. Keep existing ones, they carry context.
- Comment on dead code. Don't delete.
- Natural human text in errors, descriptions, toasts. No dashes, no robotic phrasing. Descriptions start capitalized, end with period.
- One-file plugin default. Split only past ~250 lines or when second file is genuinely reusable (`utils.ts`, `settings.ts`, `components/`).
- No abstraction for 1-2 call sites. Inline beats single-use hook. `createX` used once is just a function call.
- Don't reimplement what `@webpack/common` or `@utils/*` exports. Search first.
- Don't cache Discord data. Stores are source of truth, read on demand. Cache only what isn't in a store.
- Don't manage state Discord manages. `useStateFromStores` over `useState` + flux that mirrors a store.
- Don't recreate Discord components. Reuse `Button`, `TextInput`, `Tooltip`, `Menu.*`, etc. Hand-rolled `<button>` loses theme, focus rings, a11y.
- No state machine for boolean. No class wrapping single function. No `Strategy`/`Manager`/`Handler` suffix unless multiple implementations exist.

### TypeScript

- `strict: true`, `noImplicitAny: false`, `noUncheckedIndexedAccess: false`. Annotate params explicitly. Array index access not auto `undefined`.
- Never `any`. Use `unknown` + narrow, or type webpack results via `find*` generic.
- Never `as unknown as`. Write type guard or use `satisfies`.
- Never `@ts-ignore`. Use `@ts-expect-error` with one-line reason only when unavoidable.
- Never `!` non-null assertion. Narrow with `if` or early return.
- Never `enum` (including `const enum`). Use `as const` object plus literal union.
- Never boxed primitives (`Number`, `String`, `Boolean`, `Object`, `Function`, `{}`).
- Never `namespace`. Modules only.
- Never `../../` when `@alias` exists.
- `import type` for type-only imports, including from `"react"`. Plain `import { ReactNode }` is violation.
- `satisfies T` over `as T` when value already conforms. `as` only for genuine narrowing.

### Plugin Policy

Does NOT get merged:

- No plugins that only do something trivially achievable with existing built-in plugins or Discord features.
- No CSS-only plugins that only hide or redesign UI elements. (Negotiable in some cases.)
- No untrusted third-party APIs. No plugins requiring users to supply their own API keys. (Negotiable in some cases.)
- Do not introduce new dependencies unless strictly necessary and well justified.

### Plugin Structure

- Every NEW source file starts with SPDX header:
  ```
  /*
   * Vencord, a Discord client mod
   * Copyright (c) <year> Vendicated and contributors
   * SPDX-License-Identifier: GPL-3.0-or-later
   */
  ```
  Header says `Vencord, a Discord client mod` even on new Nun/Equicord-only files. Nun/Equicord is a Vencord fork, upstream attribution is kept across the whole tree. Don't change it to "Nun/Equicord".
  Older files carry the full GPL preamble. Leave existing headers alone, don't rewrite them.
- Folder per plugin. `src/plugins/<name>/index.tsx`, `src/equicordplugins/<name>/index.tsx`, `src/nun/<name>/index.tsx` or `src/userplugins/<name>/index.tsx`. Single-file plugins still get a folder.
- Folder suffixes the build filters on: `.desktop`, `.web`, `.dev`, `.discordDesktop`, `.vesktop`, `.equibop`.
- `export default definePlugin({ ... })`. Never named.
- Required fields: `name`, `description`, `authors`. Use `Devs`, `EquicordDevs` or `NunDevs`, never inline.
- List `dependencies` for every API plugin used.
- Lock environment via folder suffix. Per-setting platform gating via `target?: "WEB" | "DESKTOP" | "BOTH"` on the setting def (not the plugin). Code-path gating via build constants.
- `requiresRestart` defaults true when `patches` exist. Set only to override.
- `startAt?: StartAt` overrides default `WebpackReady`. Values: `Init`, `DOMContentLoaded`, `WebpackReady`.
- `settingsAboutComponent?: React.ComponentType` renders above settings UI.
- `reporterTestable?: ReporterTestable` flags parts the auto-reporter exercises (`Start`, `Patches`, `FluxEvents`, `None`).
- `isModified?: true` marks an upstream Vencord plugin Nun/Equicord modified.
- Optional: `tags?: PluginTag[]` (closed list in `src/utils/types.ts`), `required` (forced on, hidden toggle), `enabledByDefault` (on at first run, toggleable), `hidden` (off the UI), `searchTerms?: string[]`.

#### Declarative over imperative

Use these plugin fields instead of calling `add*`/`remove*` manually. `PluginManager` handles lifecycle and auto-enables the matching API plugin.

`commands`, `contextMenus`, `flux`, `onBeforeMessageSend`, `onBeforeMessageEdit`, `onMessageClick`, `chatBarButton`, `chatBarButtonWrapper`, `messagePopoverButton`, `renderMessageAccessory`, `renderMessageDecoration`, `renderMemberListDecorator`, `renderNicknameIcon`, `renderProfileCollection`, `renderProfileSection`, `headerBarButton`, `userAreaButton`, `userProfileBadge`, `managedStyle`, `toolboxActions`, `audioProcessor`.

Wrapper-style fields take `{ render | wrapper, priority }`, never bare function.

Imperative `add*`/`remove*` only when: multiple items of same kind, conditional, or after `start()`. Pair in `stop()`. Never mix both for same item.

Imperative usage MUST list the API in `dependencies`:

| API | Dependency |
|---|---|
| ContextMenu | `ContextMenuAPI` |
| MessageEvents | `MessageEventsAPI` |
| ChatButtons | `ChatInputButtonAPI` |
| Badges | `BadgeAPI` |
| MemberListDecorators | `MemberListDecoratorsAPI` |
| MessageAccessories | `MessageAccessoriesAPI` |
| MessageDecorations | `MessageDecorationsAPI` |
| MessagePopover | `MessagePopoverAPI` |
| NicknameIcons | `NicknameIconsAPI` |
| HeaderBar | `HeaderBarAPI` |
| UserArea | `UserAreaAPI` |
| ProfileCollections | `ProfileCollectionsAPI` |
| ProfileSections | `ProfileSectionsAPI` |
| AudioPlayer | `AudioPlayerAPI` |

Declarative fields auto-enable these. Imperative doesn't.

#### Lifecycle

- `start()` runs at `StartAt.WebpackReady` by default.
- `stop()` reverses everything `start()` did.
- Never throw from `start`/`stop`.
- Methods called via `$self` must live on the plugin object. Closures over module locals aren't callable.
- Never `Vencord.Plugins.plugins["Name"]`. Import directly, use `isPluginEnabled(name)` from `@api/PluginManager`.

### Settings

- `definePluginSettings({...})` from `@api/Settings`. Assign to `settings`.
- Every non-SELECT needs `default`. SELECT puts `default: true` on one option.
- `restartNeeded: true` only when value feeds a patch replacement or eager-load.
- `hidden`/`disabled` can be functions for conditional UI. Never delete keys to remove them. Write a migration.
- `withPrivateSettings<T>()` for internal state. Never widen the global `Settings` interface.
- `isValid(this, value)` → `true | false | string` (error msg). Pass via `definePluginSettings(def, checks)` second arg when `this` typing needed.
- `onChange(newValue)` runs post-commit. Not for validation, use `isValid`.
- `componentProps` forwards props to the underlying input.
- `SLIDER`: `markers: number[]` (>=2) + numeric `default`. `stickToMarkers: false` allows in-between.
- `STRING`: `multiline: true` for textarea.
- Renames at module top before `definePlugin`. Helpers: `migratePluginSettings`, `migratePluginSetting`, `migratePluginToSettings`, `migrateSettingToPlugin`, `migrateSettingsFromPlugin`, `migrateOldSettingToNewPlugin`.

#### Reading

- React: `settings.use([...keys])`. Hoist as `const KEYS = ["a", "b"] as const` at module scope, or memoize. Fresh array literal resubscribes every render.
- Never `settings.use()` with no arg. Subscribes to everything.
- Hot paths: destructure `settings.store.x` once. Never re-read in loops or render rows.
- `OptionType.COMPONENT` components must be module-level. Props: `setValue`, `option`, `closePluginSettings`. No `setError` exists, use `isValid` for validation.
- `settings.plain` is non-reactive snapshot. Use in non-React hot paths and event handlers.

#### UX

- Defaults match the choice 80% of users want, not "off".
- SELECT with two options is a BOOLEAN. Don't dress it up.
- If explanation outgrows `description`, move it to `settingsAboutComponent`.

### Flux

- Plugin-lifetime: `flux: { ACTION_TYPE(payload) { ... } }` on plugin object. `PluginManager` subscribes/unsubscribes, binds `this` to plugin, wraps handler in try/catch that logs throws and rejections. Handlers may be `async`.
- Scoped: `FluxDispatcher.subscribe` inside `useEffect` (cleanup with `unsubscribe(sameRef)`) or plugin `start()` (mirrored `unsubscribe` in `stop()`). Reuse exact function reference.
- Never both `flux` and manual `subscribe` for same event in one plugin.
- Never `try/catch` inside flux handler. Wrapper already logs. Never throw.
- Action types are string literals matching `FluxEvents`. Never import Discord's `ActionTypes` constant.
- Dispatch: `FluxDispatcher.dispatch({ type: "ACTION_TYPE", ...payload })`. `type` mandatory.
- Don't optional-chain `subscribe?.`/`unsubscribe?.`. FluxDispatcher is bound by `WebpackReady`.

### Patching

- One patch per concern. Minimum code touched.
- `find` is string when possible. Anchor on stable tokens: intl keys (`#{intl::KEY}`), methods with trailing punctuation, action-type literals, distinct CSS/path literals. Prefer intl over English copy.
- `match` is always RegExp. `\i` for every minified identifier. Never letters or named patterns.
- Bound every gap with `.{0,N}?`. Never `.+?`/`.*?` unbounded. Prefer N <= 150. N > 500 needs justification. N > 1000 = wrong anchor.
- Use lookbehind/lookahead to inject without re-consuming context.
- Capture only what you reuse. Reused-only groups become `(?:...)` or move to lookarounds.
- `#{intl::KEY}` expands to `.HASH` or `["HASH"]` (when hash starts with digit or contains `+`/`/`). Never hardcode the hashed form.
- `#{intl::KEY::raw}` emits the key string unchanged. Use ONLY when `intl reverse HASH` returns nothing. Never use to hardcode a known key's hash.
- `#{intl::KEY::hash}` emits just the hash, no `.` or brackets. Use to match object-literal form (`"HASH":[...]`) in the strings-table module.
- `/g` only when intentionally hitting multiple sites in one module.
- Replace: `$&` keeps match, `$1`/`$2` for captures, `$self.fn(...)` calls plugin code.
- Never inject statement where Discord expects expression.
- `group: true` for atomic multi-step rewrites. On any failure (no effect or throw), whole group rolls back.
- `predicate: () => boolean` gates on runtime values. `fromBuild`/`toBuild` gate on Discord build numbers. Both apply per patch and per replacement. Never branch inside `replace`.
- `noWarn: true` suppresses "had no effect" warning. Use only for intentionally optional replacements.
- `all: true` only when one anchor legitimately occurs across multiple modules. Intl keys resolve to one module — do NOT set `all` on intl-anchored patches.
- Never `try/catch` to silence a failing replacement. Fix the match.
- Never depend on argument names or object-key order. Use `arguments[i]` — minifiers rename params and reorder destructured keys.
- Prefer multiple small patches over one with broad find and many replacements.
- In DEV, failing replacements auto-diff 200 chars around the match site. Read it before retrying.
- Never reference build flags literally inside `replace`. They only exist in Nun/Equicord's bundle. Interpolate outside:
  ```js
  // BAD
  replace: "IS_WEB?foo:bar"
  // GOOD
  replace: IS_WEB ? "foo" : "bar"
  // OK
  replace: `${IS_WEB}?foo:bar`
  ```
- Keep `replace` small: wrap a single function via patch + `$self`, push logic to plugin TS. A 3-line `$self.handleClick(arguments[0])` beats a 30-line render rebuild.

#### Examples

```js
// clean replacement
find: "#{intl::EXAMPLE_KEY_A}),icon:"
match: /#{intl::EXAMPLE_KEY_A}\)/
replace: "$self.exampleFn(arguments[0]))"

// appending
find: "#{intl::EXAMPLE_KEY_B}"
match: /#{intl::EXAMPLE_KEY_B}.{0,100}(?=])/
replace: "$&,$self.exampleRender(arguments[0].guild)"

// wrapping with lookbehind
find: "#{intl::EXAMPLE_KEY_C}"
match: /(?<="aria-atomic":!0,children:)\i/
replace: "$self.exampleWrap({ children: $& })"
```

### Webpack access

- Top level: lazy finders only. `findByPropsLazy`, `findByCodeLazy`, `findComponentByCodeLazy`, `findStoreLazy`, `findCssClassesLazy`, `getUserSettingLazy`, `proxyLazyWebpack`.
- Direct `find(...)` only inside `start()` or runtime callbacks.
- Components: `findComponentByCodeLazy` (top level) or `findComponentByCode` (runtime). Never `findByProps*` for React components — `displayName` is mangled, prop shapes shift. `findByPropsLazy` stays correct for stores, utility modules, action-creator objects. `waitForComponent` is `@webpack/common` internal.
- `proxyLazy` for same-tick destructuring. `proxyLazyWebpack(() => ...)` when the value depends on webpack. `makeLazy` for plain deferred values.
- `mapMangledModuleLazy(code, mapping)` to extract multiple exports from one mangled module. `extractAndLoadChunksLazy([codes], matcher?)` to force-load a lazy chunk before a `find*`.
- Before `findStoreLazy("X")`, check `src/webpack/common/stores.ts` — many are already exported.
- `@webpack/common` exports backed by `waitFor` (stores, `FluxDispatcher`, `Parser`, `Alerts`, hooks) are `undefined` until webpack ready. Reference inside functions, not at module top.
- No `eagerPatches`, no `wreq(id)` brute forcing.

### React

- Import hooks and `React` from `@webpack/common`. Never `import React from "react"`. Only `import type` from `"react"`.
- Forbidden: `React.FC`, `React.memo`, `React.lazy`, `React.Suspense`, `React.Children`, `React.cloneElement`, `React.isValidElement`, `React.PureComponent`. Type props with named `interface`. Use `LazyComponent` over `React.lazy`. Use `ErrorBoundary` over `React.Suspense`.
- Conditional rendering returns `null`, never `undefined`/`false`.
- Wrap every component injected by a patch with `ErrorBoundary.wrap(C, { noop: true })`. Same for any `render`/`wrapper` in declarative fields.
- `LazyComponent(() => findByCode(...))` for webpack-sourced components used before webpack is ready.
- `useStateFromStores([Store1, ...], () => derive(), deps?, areEqual?)`. List every store the selector reads. Pass `areEqual` (e.g. `shallowEqual`) when selector returns objects/arrays/new refs. Pass `deps` when selector closes over props/state. Selector must be pure and synchronous.
- Fragments: prefer `<>...</>`. `React.Fragment` only when fragment needs a `key`.
- List keys: stable identifiers only. Never `key={index}` on mutable lists.
- `ReactDOM.createPortal` from `@webpack/common`. Never `"react-dom"`.
- No `useMemo`/`useCallback` on cheap values that don't feed a dep array.

### CSS / Classes

- `classNameFactory` from `@utils/css`. Never from `@api/Styles` (deprecated re-export).
- Prefix `vc-<plugin>-`. Usage: `cl("base", ["a", "b"], { active: cond })`.
- Combine classes with `classes(a, b)` from `@utils/misc`. Never template strings, never `+`.
- Discord mangled classes via `findCssClassesLazy("propA", ...)`. Never hardcode any part: prefix, suffix, or substring. This includes attribute selectors: `[class*="EXAMPLE_"]`, `[class^="EXAMPLE_"]`, `[class$="_EXAMPLE"]`, `[class~="EXAMPLE"]`, `[class|="EXAMPLE"]`. Resolve names with `findCssClassesLazy` and build selectors via `classNameToSelector` from `@utils/css`.
- Static stylesheet: `import "./style.css"`. Runtime-toggleable: `import name from "./style.css?managed"` plus `enableStyle`, `disableStyle`, `toggleStyle`, `setStyleClassNames` from `@api/Styles`.
- Managed CSS variable selectors use `[--varName]`. Runtime rewrites these via `setStyleClassNames` at enable/recompile time (NOT build time). Call `setStyleClassNames(style, classNames)` before `enableStyle(style)`.
- Top-level selectors start with `.vc-<plugin>-`. Descendant element selectors like `.vc-foo button` allowed.
- No `:root` in plugin CSS — use a `.vc-<plugin>-root` wrapper or `documentElement.style.setProperty`.
- No `@import`.
- Prefer Discord CSS vars like `var(--background-primary)` over literal colors.
- Inline `style={{}}` only for dynamic per-render values. Use `Margins.top8` etc. for spacing, not inline `style`.
- `!important` needs a trailing comment explaining the Discord rule being overridden. Prefer `:where()` over `!important` when fighting specificity.

### Native / Desktop

- Desktop-only: folder suffix `.desktop`. Mixed-target with `native.ts` doesn't use the suffix.
- `native.ts` next to `index.tsx`, OR `native/index.ts` for multi-file natives. Exports auto-register as IPC handlers via `~pluginNatives`.
- Handler first arg is `IpcMainInvokeEvent`. All other args are renderer-controlled and untrusted — validate type, length, content. Never throw raw `Error` (leaks main-process paths) — return `{ success: false, error: "..." }` or scrubbed message.
- Filesystem paths: `normalize` and assert `startsWith(<allowed root>)`. Never `rm`/`readFile`/`writeFile` a renderer-supplied path without this guard.
- Network: URL allowlist (regex or `url.origin`), streaming size cap, redirect-depth cap.
- Subprocess: `spawn` with argv arrays. Never `exec` a renderer-derived string. Never `shell: true` with untrusted input.
- `shell.openExternal`: only with https allowlist.
- Renderer side:
  ```ts
  const Native = VencordNative.pluginHelpers.MyPlugin as PluginNative<typeof import("./native")>;
  ```
- `pluginHelpers` key matches `definePlugin.name` exactly (case-sensitive).
- Renderer must never import `fs`, `path`, `net`, `http`, `https`, `child_process`, `electron`. Go through `native.ts`.
- File pickers: `saveFile`/`chooseFile` from `@utils/web`. Don't re-implement via `dialog.show*` over IPC.
- Only `src/preload.ts` may `contextBridge.exposeInMainWorld`.

### Resource lifecycle

- Every `setInterval`, `setTimeout` (> ~5s), `addEventListener`, `FluxDispatcher.subscribe`, `ResizeObserver`, `IntersectionObserver`, `AbortController`, `MessageEvents.addPreSendListener` started in `start()` dies in `stop()`. In `useEffect`, pair with cleanup return.
- `addEventListener` needs a named function reference. Inline arrow + `removeEventListener` doesn't match and leaks.
- Long-lived component timers use `useFixedTimer`/`useTimer` from `@utils/react`.
- Every `add*` in `start()` pairs with `remove*` in `stop()`.
- Idle timer pattern:
  ```ts
  let intervalId: number | undefined;
  start() { intervalId = setInterval(tick, 30_000); }
  stop()  { if (intervalId !== undefined) { clearInterval(intervalId); intervalId = undefined; } }
  ```

### Storage

- Persistent state: `DataStore` from `@api/DataStore` (idb-backed). Never `localStorage`/`sessionStorage`/`indexedDB`.
- Plain settings: `definePluginSettings`. Internal hidden state: `withPrivateSettings<T>()`.
- DataStore API: `get`, `set`, `setMany`, `getMany`, `update`, `del`, `delMany`, `clear`, `keys`, `values`, `entries`, `createStore` (custom namespace).
- Namespace keys with plugin name: `` await DataStore.get(`MyPlugin_key`) `` or `createStore("MyPlugin", "store")`.
- Never store tokens, message content, or other user data in keys readable by other plugins.

### Network

- Discord API: `RestAPI.get/post/put/del({ url: Constants.Endpoints.X })`. Never raw `fetch("/api/v9/...")`.
- Third-party: `fetch` only against endpoints allowlisted in `src/main/csp` or routed through `native.ts`. Set `AbortController`, abort in `stop()` or effect cleanup.
- Never embed user-supplied URLs without `parseUrl` validation.

### Logging

- `new Logger("PluginName")` per plugin, hoisted to module scope.
- `debug` for dev traces, `info` for lifecycle, `warn` for recoverable, `error` for unrecoverable. Never log message content, tokens, or auth headers.

### Commands

- Declarative: `commands: [{ name, description, options?, execute(args, ctx) { ... } }]`. Auto-enables `CommandsAPI`.
- Imperative: `registerCommand(command, pluginName)` / `unregisterCommand(name)` from `@api/Commands` for late/conditional. Pair in `stop()`.
- Inside `execute`: `findOption(args, "name", default?)` from `@api/Commands`. Never index `args` positionally.
- Reply: `sendBotMessage(ctx.channel.id, { content })` for ephemeral bot msgs. Real sends: `sendMessage` from `@utils/discord`.
- Option types: `ApplicationCommandOptionType.{STRING,INTEGER,BOOLEAN,USER,CHANNEL,ROLE,MENTIONABLE,NUMBER,ATTACHMENT,SUB_COMMAND,SUB_COMMAND_GROUP}`. Input types: `ApplicationCommandInputType.{BUILT_IN,BUILT_IN_TEXT,BUILT_IN_INTEGRATION,BOT,PLACEHOLDER}`.
- Required options come first. Mark with `required: true`.

### UI surface

- Chat bar button: `chatBarButton: { render: ButtonFactory, position?, priority? }`. Factory is `ChatBarButtonFactory` from `@api/ChatButtons`, returns `<ChatBarButton>`. Dep: `ChatInputButtonAPI`.
- Message popover: `messagePopoverButton: { label, icon, message => action } | render`. Dep: `MessagePopoverAPI`.
- Message accessory (below msg): `renderMessageAccessory: { render(message), position? }`. Dep: `MessageAccessoriesAPI`.
- Message decoration (inline): `renderMessageDecoration: { render, position? }`. Dep: `MessageDecorationsAPI`.
- Member list decorator: `renderMemberListDecorator: { render, onlyIn? }`. Dep: `MemberListDecoratorsAPI`.
- Header bar, user area, nickname icon, profile collection/section, badges, audio processor: same `{ render | wrapper, priority }` shape. See Declarative dependency map.

### Context menus

- Declarative: `contextMenus: { "channel-context"(children, props) { ... } }`. Auto-enables `ContextMenuAPI`.
- Inside callback: `findGroupChildrenByChildId(id, children)` from `@api/ContextMenu` to locate group, then `children.splice(...)` to insert. `matchSubstring: true` for dynamic ids.
- Imperative `addContextMenuPatch`/`removeContextMenuPatch` only when post-`start()` or conditional. Requires `dependencies: ["ContextMenuAPI"]`.
- Children: `Menu.MenuItem`, `Menu.MenuGroup`, `Menu.MenuSeparator`, `Menu.MenuCheckboxItem`, `Menu.MenuRadioItem`, `Menu.MenuControlItem`.
- Mutate `children` in place. Returning a new array does nothing.

### Notifications & alerts

Pick one per event. Never two for the same thing.

| Need | Use |
|---|---|
| Transient feedback (<2s) | `showToast(msg, Toasts.Type.SUCCESS)` from `@webpack/common` |
| Background happened, user may act later | `showNotification({ title, body })` from `@api/Notifications` |
| Urgent inline top-bar | `Notices.showNotice(msg, btnText, cb)` from `@api/Notices` (sparingly — blocks UI) |
| Modal confirm | `Alerts.show({ title, body, onConfirm })` from `@webpack/common` |

### Use what exists

Search before writing. Common needs:

| Need | Use |
|---|---|
| Sleep | `sleep(ms)` from `@utils/misc` |
| Debounce / throttle | `lodash.debounce` / `lodash.throttle` |
| Date format | `moment` or `formatDuration`/`formatDurationMs` from `@utils/text` |
| Markdown parse | `Parser.parse(text)` |
| Snowflake → date | `SnowflakeUtils.extractTimestamp(id)` |
| URL parse | `parseUrl` from `@utils/misc` |
| Regex escape | `escapeRegExp` from `@utils/text` |
| Join lists | `humanFriendlyJoin([...])` from `@utils/text` |
| Class concat | `classes(a, b, ...)` from `@utils/misc` |
| Margins | `Margins.top8` etc, not inline `style` |
| Deep clone | `lodash.cloneDeep` |
| Clamp / range | `lodash.clamp`, `makeRange` from `@utils/types` |
| Open URL | `VencordNative.native.openExternal(url)` or `MaskedLink` |
| Copy clipboard | `copyWithToast` from `@utils/discord` |
| Fetch uncached user | `fetchUserProfile(id)` from `@utils/discord` |
| Open user profile | `openUserProfile(id)` |
| Send chat msg | `sendMessage(channelId, { content })` from `@utils/discord` |

### Discord components

Reuse from `@webpack/common`. Don't recreate.

| Need | Component |
|---|---|
| Button | `Button` |
| Text input | `TextInput` |
| Multiline | `TextArea` |
| Dropdown | `Select` / `SearchableSelect` |
| Checkbox | `Checkbox` |
| Slider | `Slider` |
| Tooltip | `Tooltip` (function-child API) |
| Context menu items | `Menu.*` |
| Modal | `openModal(p => <ModalRoot {...p}>...</ModalRoot>)` |
| Scroller | `ScrollerThin` / `ScrollerAuto` |
| User pill | `UserSummaryItem` |
| Avatar | `Avatar` |
| Timestamp | `Timestamp` |
| External link | `MaskedLink` |

### Never hardcode

- Discord CDN URLs (`cdn.discordapp.com/avatars/...`, `/icons/...`, `/emojis/...`) → `IconUtils`. Third-party hosts (badge services, usrbg) fine but must be in `src/main/csp`.
- API paths → `Constants.Endpoints` + `RestAPI`.
- Intl strings → `#{intl::KEY}`.
- Mangled CSS classes → `findCssClassesLazy`.
- Minified vars in patches → `\i`.
- `console.*` → `Logger`.
- Toast type strings → `Toasts.Type.*`.
- Class name concatenation → `classes(...)`.

### Forbidden

- Raw DOM (`document.querySelector`, `MutationObserver`, `element.style`). Use webpack patches and React.
- Empty `catch` blocks.
- `settings.use()` with arrays mutated in place. Reassign with a new array.
- `localStorage` / `sessionStorage` / `indexedDB`. Use `DataStore`.
- `window.addEventListener` / `document.addEventListener` without matching `removeEventListener` in `stop()` or effect cleanup.
- `fetch` to Discord endpoints. Use `RestAPI`.
- `Vencord.Plugins.plugins["Name"]` access.
- `await new Promise(r => setTimeout(r, ms))`. Use `sleep`.
- Hand-rolled debounce / throttle / date formatter / button / input / select / checkbox / tooltip / modal.
- `useState` + flux subscription mirroring a store. Use `useStateFromStores`.
- Polling Discord state. Subscribe to flux events.
- `JSON.parse(JSON.stringify(x))` deep clone. Use `lodash.cloneDeep`.
- Class wrappers around a single function. Custom event bus. `Strategy`/`Factory`/`Manager`/`Provider`/`Controller` suffix for one impl. State machine for boolean. Wrapping `console.error` in your own reporter.

### Build constants

Replaced at build time. Reference only in plugin TS, never literally inside `replace`.

| Constant | Meaning |
|---|---|
| `IS_WEB` | Web build (extension/userscript/standalone web) |
| `IS_EXTENSION` | Browser extension |
| `IS_USERSCRIPT` | Userscript |
| `IS_STANDALONE` | Standalone (no updater) |
| `IS_UPDATER_DISABLED` | Updater off |
| `IS_DEV` | Dev build (auto-diff, extra logs) |
| `IS_REPORTER` | Auto-reporter |
| `IS_COMPANION_TEST` | Companion test |
| `IS_ANTI_CRASH_TEST` | Anti-crash test |
| `IS_DISCORD_DESKTOP` | Discord desktop injection |
| `IS_VESKTOP` | Vesktop |
| `IS_UNU` | Equibop |
| `IS_EQUIBOP` | Unu |
| `VERSION` | Nun/Equicord version string |
| `BUILD_TIMESTAMP` | Build epoch ms |

### Reference

#### `@vencord/discord-types`
`Channel`, `Guild`, `GuildMember`, `User`, `Role`, `Message`, `Command`, `FluxEvents`, store types.

#### `@api/*`
`Settings`, `Commands`, `DataStore`, `ContextMenu`, `Badges`, `Notices`, `Notifications`, `MessageEvents`, `MessageUpdater`, `MessageAccessories`, `MessageDecorations`, `MessagePopover`, `MemberListDecorators`, `ServerList`, `ChatButtons`, `HeaderBar`, `UserArea`, `NicknameIcons`, `ProfileCollections`, `ProfileSections`, `AudioPlayer`, `UserSettings`, `UserSettingDefinitions`, `Styles`, `PluginManager`, `SettingsSync`.

`@api/Commands` re-exports `sendBotMessage`, `findOption`, `ApplicationCommandInputType`, `ApplicationCommandOptionType`, `ApplicationCommandType`.

`@api/ContextMenu`: `addContextMenuPatch`, `removeContextMenuPatch`, `addGlobalContextMenuPatch`, `removeGlobalContextMenuPatch`, `findGroupChildrenByChildId`, `NavContextMenuPatchCallback`, `GlobalContextMenuPatchCallback`.

Deprecated: `@api/Themes`. `classNameFactory` re-export from `@api/Styles`.

#### `@utils/*`
- `Logger`. `new Logger(name)`.
- `css`. `classNameFactory`, `classNameToSelector`.
- `misc`. `classes`, `sleep`, `isObject`, `isObjectEmpty`, `pluralise`, `parseUrl`, `identity`, `interpolateIfDefined`, `tryOrElse`, `isPluginDev`, `removeFromArray`.
- `text`. `formatDuration`, `formatDurationMs`, `humanFriendlyJoin`, `makeCodeblock`, `toInlineCode`, `escapeRegExp`, `stripIndent`, `ZWSP`.
- `react`. `useAwaiter`, `useForceUpdater`, `useIntersection`, `useTimer`, `useFixedTimer`, `useCleanupEffect`, `NoopComponent`, `isPrimitiveReactNode`. Re-exports `LazyComponent` from `lazyReact`.
- `lazy`. `makeLazy`, `proxyLazy`.
- `lazyReact`. `LazyComponent`.
- `modal`. `openModal`, `openModalLazy`, `closeModal`, `closeAllModals`, `openMediaModal`, `ModalRoot`, `ModalHeader`, `ModalContent`, `ModalFooter`, `ModalCloseButton`, `ModalSize`, `Modals`, `ModalAPI`, `CloseButton`.
- `discord`. `getCurrentChannel`, `getCurrentGuild`, `getIntlMessage`, `getIntlMessageFromHash`, `openUserProfile`, `openPrivateChannel`, `sendMessage`, `insertTextIntoChatInputBox`, `copyWithToast`, `getUniqueUsername`, `getGuildAcronym`, `fetchUserProfile`, `openImageModal`, `openInviteModal`, `getTheme`, `Theme`, `hasGuildFeature`.
- `clipboard`. `copyToClipboard`, `readClipboard`.
- `margins`. `Margins` (`top4/8/16/20`, `bottom4/8/16/20`, `left8/16`, `right8/16`).
- `guards`. `isTruthy`, `isNonNullish`.
- `web`. `saveFile`, `chooseFile`.
- `constants`. `Devs`, `EquicordDevs`, `EquicordDevsById`, `NunDevs`, `NunDevsById`, `IS_WINDOWS`, `IS_MAC`, `IS_LINUX`, `IS_MOBILE`, support channel/guild/role IDs.
- `types`. `OptionType`, `StartAt`, `ReporterTestable`, `definePlugin`.

#### `@components/*`
`Badge`, `BaseText`, `Button`, `Card`, `CheckedTextInput`, `CodeBlock`, `Divider`, `ErrorBoundary`, `ErrorCard`, `Flex`, `FormSwitch`, `Grid`, `Heading`, `Heart`, `Icons`, `Link`, `Notice`, `Paragraph`, `Span`, `Switch`, `margins` (`Margins`), `settings` subtree.

`ErrorBoundary.wrap(Component, { noop?, fallback?, onError?, message? })`.

#### `@webpack/common`

Stores. `UserStore`, `GuildStore`, `GuildRoleStore`, `GuildMemberStore`, `GuildChannelStore`, `ChannelStore`, `SelectedChannelStore`, `SelectedGuildStore`, `MessageStore`, `PresenceStore`, `RelationshipStore`, `PermissionStore`, `ReadStateStore`, `EmojiStore`, `StickersStore`, `ThemeStore`, `VoiceStateStore`, `TypingStore`, `DraftStore`, `WindowStore`, `AccessibilityStore`, `PendingReplyStore`, `UserProfileStore`, `StreamerModeStore`, `SpotifyStore`, `NotificationSettingsStore`, `LocaleStore`, `ExperimentStore`, `QuestStore`. Full list in `src/webpack/common/stores.ts`.

React + hooks. `React`, `useState`, `useEffect`, `useLayoutEffect`, `useMemo`, `useRef`, `useReducer`, `useCallback`, `useStateFromStores`.

Components. `Tooltip`, `TextInput`, `TextArea`, `Select`, `SearchableSelect`, `Slider`, `Checkbox`, `Avatar`, `Menu`, `Popout`, `Dialog`, `TabBar`, `Clickable`, `MaskedLink`, `Timestamp`, `FocusLock`, `UserSummaryItem`, `ColorPicker`, `OAuth2AuthorizeModal`, `ScrollerThin`, `ScrollerAuto`, `ScrollerNone`, `ListScrollerThin`, `ListScrollerAuto`.

Utils. `FluxDispatcher`, `RestAPI`, `Constants` (with `.Endpoints`), `SnowflakeUtils`, `Parser`, `PermissionsBits`, `Alerts`, `Toasts`, `showToast`, `createToast`, `moment`, `lodash`, `i18n`, `IconUtils`, `ColorUtils`, `ImageUtils`, `DateUtils`, `UsernameUtils`, `DisplayProfileUtils`, `URLUtils`, `Humanize`, `EmojiUtils`, `UserUtils`, `UploadHandler`, `UploadManager`, `ComponentDispatch`, `ExpressionPickerStore`, `ReadStateUtils`, `PopoutActions`, `ApplicationAssetUtils`, `zustandCreate`.

`Toasts.Type`: `MESSAGE`, `SUCCESS`, `FAILURE`, `CUSTOM`, `CLIP`, `LINK`, `FORWARD`, `BOOKMARK`, `CLOCK`. `Toasts.Position`: `TOP` (0), `BOTTOM` (1).

Routers. `NavigationRouter`, `ChannelRouter`, `SettingsRouter`.

Actions. `MessageActions`, `ChannelActionCreators`, `UserProfileActions`, `InviteActions`, `GuildActions`, `VoiceActions`, `DraftActions`, `PinActions`, `MessageCache`.

Menu. `Menu`, `ContextMenuApi` (`openContextMenu`, `closeContextMenu`, `openContextMenuLazy`).

#### Lazy webpack imports
From `@webpack`. `findByPropsLazy`, `findByCodeLazy`, `findComponentLazy`, `findComponentByCodeLazy`, `findExportedComponentLazy`, `findStoreLazy`, `findCssClassesLazy`, `findLazy`, `proxyLazyWebpack`, `LazyComponentWebpack`, `mapMangledModuleLazy`, `extractAndLoadChunksLazy`, `waitFor`.

`waitForStore` / `waitForComponent` live in `@webpack/common/internal.tsx`. Plugins don't call them directly.

#### `IconUtils`
`getUserAvatarURL(user, canAnimate?, size?, format?)`, `getUserBannerURL({ id, banner, canAnimate?, size })`, `getGuildIconURL({ id, icon, size?, canAnimate? })`, `getGuildBannerURL(guild, canAnimate?)`, `getGuildSplashURL`, `getGuildDiscoverySplashURL`, `getGuildHomeHeaderURL`, `getChannelIconURL({ id, icon })`, `getResourceChannelIconURL`, `getEmojiURL({ id, animated, size })`, `getApplicationIconURL`, `getGameAssetURL`, `getVideoFilterAssetURL`, `getAvatarDecorationURL`, `getGuildMemberAvatarURL`, `getGuildMemberAvatarURLSimple`, `getGuildMemberBannerURL`, `getDefaultAvatarURL(id)`, `hasAnimatedGuildIcon`, `isAnimatedIconHash`.
