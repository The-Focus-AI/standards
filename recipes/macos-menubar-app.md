---
title: "Build and release single-file macOS menu bar apps"
summary: "Architecture, TCC-safe bundling, sed unit testing, reproducible icons, and universal GitHub Releases."
status: "Reference"
---

Native macOS menu bar utilities need hardware, WindowServer, and TCC permissions
that Linux cloud containers cannot exercise. Record that local/macOS runner
exception in the project's `AGENTS.md` ([development](../handbook/development.md))
and follow the approval and release gates in [release](../handbook/release.md).

## Keep one Swift source file, two execution modes

Keep each utility in a single `<app>.swift` file with `#!/usr/bin/env swift` at line 1
and zero external Swift Package Manager dependencies (`Cocoa`, `Foundation`,
`SwiftUI`, `CoreBluetooth`, `CoreLocation`, `CoreWLAN`, `CoreServices`, `MapKit`).

- **Script mode (`./app.swift`)**: fast iteration without Xcode or `.xcodeproj` state.
- **Bundle mode (`AppName.app`)**: required for distribution, Login Items, and
  per-app TCC permissions (`Bluetooth`, `Location`, Wi-Fi SSID access). Running raw
  `./app.swift` borrows the parent terminal's TCC identity instead of the app's.

Separate pure data models, parsers, layout math, and state machines from `AppKit`
controllers, and place a single `// MARK: - Main Entry Point` marker immediately
before `NSApplication` startup so headless CLI flags and unit tests can bypass UI
boot cleanly.

## Support headless CLI inspection and runtime version truth

GUI menu bar apps are opaque to CI and remote debugging unless they expose text
entry points. Implement at least `--version` and `--dump-menu` in every utility,
and flush `stdout` (`fflush(stdout)`) after log lines so piped processes do not
lose buffered output when terminated.

Read the version string from `Bundle.main.infoDictionary` rather than hardcoding a
second constant in Swift:

```swift
func appVersionText() -> String {
    let info = Bundle.main.infoDictionary
    let short = (info?["CFBundleShortVersionString"] as? String)?
        .trimmingCharacters(in: .whitespacesAndNewlines)
    let build = (info?["CFBundleVersion"] as? String)?
        .trimmingCharacters(in: .whitespacesAndNewlines)
    guard let short, !short.isEmpty else { return "development build" }
    guard let build, !build.isEmpty else { return short }
    return "\(short) (\(build))"
}
```

Display `<AppName> \(appVersionText())` as a disabled `NSMenuItem` directly above
`Quit <AppName>` (`⌘Q`), and render the real `NSMenu` off-screen for `--dump-menu`:

```swift
func printMenuDump(title: String, menu: NSMenu) {
    print("TITLE: \(title)")
    for item in menu.items {
        if item.isSeparatorItem {
            print("  ---")
        } else {
            let text = item.attributedTitle?.string ?? item.title
            let checked = item.state == .on ? " [checked]" : ""
            print("  \(text)\(checked)")
        }
    }
    fflush(stdout)
}
```

Recommended CLI flags for hardware/network monitors:

- `--version` / `-V`: print `<AppName> <short> (<build>)` and exit `0`.
- `--dump-menu`: populate the real `NSMenu`, print items as text, and exit `0`.
- `--once`: take one reading/probe, print `key=value` output, and exit `0` (or `1` on timeout).
- `--quit`: post a quit notification on `DistributedNotificationCenter` and terminate
  running instances matched via `NSRunningApplication.runningApplications(withBundleIdentifier:)`.

## Handle `LSUIElement` menu bar UX edge cases

Menu bar apps run with `LSUIElement = true` and `app.setActivationPolicy(.accessory)`
(no Dock icon). Handle four macOS behaviors explicitly:

1. **Finder reopen**: double-clicking an already-running `LSUIElement` app in Finder
   does nothing by default, making the app appear broken. Implement
   `applicationShouldHandleReopen` to open the main window or pop the status menu:

   ```swift
   func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
       statusItem?.button?.performClick(nil)
       return true
   }
   ```

2. **MacBook camera notch occlusion**: on crowded menu bars, macOS places new
   `NSStatusItem`s underneath the camera housing where they are invisible. Check
   visibility ~1.5s after launch and surface a window if occluded:

   ```swift
   if let screen = NSScreen.main,
      let left = screen.auxiliaryTopLeftArea,
      let right = screen.auxiliaryTopRightArea,
      let frame = statusItem?.button?.window?.frame {
       let notchGap = NSRect(
           x: left.maxX, y: left.minY,
           width: max(0, right.minX - left.maxX), height: left.height
       )
       if notchGap.width > 0, frame.intersects(notchGap) {
           showMainWindow()
       }
   }
   ```

3. **RunLoop modes while the menu is open**: `Timer.scheduledTimer` schedules on
   `.default` mode, which pauses while an `NSMenu` is open (`NSEventTrackingRunLoopMode`).
   Register live timers and `FSEventStream`s on `.common` / `commonModes`:

   ```swift
   RunLoop.main.add(timer, forMode: .common)
   ```

4. **Subprocess timeouts off the main thread**: never call `Timer.scheduledTimer`
   inside `DispatchQueue.global().async` — global GCD threads have no active RunLoop,
   so the timer never fires. Use a `DispatchWorkItem` with `asyncAfter` and cancel it
   after `task.waitUntilExit()`, and resolve Homebrew tools across both
   `/opt/homebrew/bin` (Apple Silicon) and `/usr/local/bin` (Intel).

## Keep storage outside iCloud Drive and guard polling

- **Store app data in `~/Library/Application Support/<AppName>/`**: never write
  high-frequency logs or caches to `~/Documents` or `~/Desktop`. Those folders are
  commonly backed by iCloud Drive (`bird`), which evicts files to cloud-only stubs
  and triggers TCC prompts or multi-second main-thread hangs on read.
- **Keep file I/O off the main thread**: parse and append logs on a dedicated serial
  `DispatchQueue`, caching parsed records keyed by `(fileSize, contentModificationDate)`.
- **Prevent overlapping probes**: guard periodic network or CLI checks with an
  `inFlight` boolean and an incrementing `generation` counter so stale callbacks are
  discarded after state resets or Wi-Fi transitions.
- **Prefer passive BLE over active GATT connections**: when reading BLE sensors that
  broadcast advertisements, scan passively (`CBCentralManagerOptionShowPowerAlertKey: false`
  with an explicit in-menu radio/permission state) and connect only on user-initiated
  history syncs.
- **Render missing data honestly**: break chart/map polylines across time gaps and
  right-align sparse sample strips instead of stretching two samples across the full
  width.

## Unit test single-file Swift without Xcode

Strip everything from `// MARK: - Main Entry Point` downward with `sed`, append a
test harness, and compile with `swiftc`. This runs in seconds on both developer Macs
and GitHub Actions `macos-latest` runners:

```sh
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/app-tests.XXXXXX")"
trap 'rm -rf "$TEST_DIR"' EXIT

sed '/\/\/ MARK: - Main Entry Point/,$d' app.swift > "$TEST_DIR/main.swift"
cat tests/checks.swift >> "$TEST_DIR/main.swift"

CLANG_MODULE_CACHE_PATH="$TEST_DIR/modulecache" \
  swiftc -O "$TEST_DIR/main.swift" -o "$TEST_DIR/checks"
"$TEST_DIR/checks" "$@"
```

## Generate `.icns` icons reproducibly from code

Check in a deterministic `make_icon.py` alongside `AppIcon.icns` so icons can be
tweaked and regenerated without binary design files:

1. Render artwork at `4096x4096` in RGBA using Python `Pillow`.
2. Draw semi-transparent highlights or shadows onto separate `Image.new("RGBA", ...)`
   layers and composite with `art.alpha_composite(layer)` — drawing `alpha < 255`
   shapes directly onto an opaque `RGBA` canvas with `ImageDraw` overwrites
   destination alpha and punches transparent holes in the icon.
3. Apply a macOS squircle mask (`824/1024` canvas ratio, ~22.5% corner radius),
   downsample with `Image.Resampling.LANCZOS` into the 10 standard `.iconset` PNG
   sizes (`icon_16x16.png` through `icon_512x512@2x.png`), and convert via native
   `iconutil`:

```sh
python3 make_icon.py   # writes icon-1024.png + AppIcon.icns via iconutil -c icns
```

## Package universal `.app` bundles and publish releases

Use reverse-DNS Bundle IDs (`ai.thefocus.<slug>`), compile universal binaries
(`arm64` + `x86_64`) via `swiftc` + `lipo`, validate `Info.plist` with `plutil -lint`,
and archive with `ditto -c -k --keepParent` (never plain `zip`, which strips bundle
extended attributes and breaks signatures):

```sh
#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:?}"
BUNDLE_ID="${BUNDLE_ID:?}"
SOURCE_FILE="${SOURCE_FILE:?}"
VERSION="${VERSION:-1.0.0}"
BUILD_NUMBER="${BUILD_NUMBER:-1}"
MIN_MACOS="${MIN_MACOS:-12.0}"
CODESIGN_IDENTITY="${CODESIGN_IDENTITY:--}"

BUNDLE_DIR="${APP_NAME}.app"
BIN="${BUNDLE_DIR}/Contents/MacOS/${APP_NAME}"
BUILD_TMP="$(mktemp -d "${TMPDIR:-/tmp}/${APP_NAME}-build.XXXXXX")"
trap 'rm -rf "${BUILD_TMP}"' EXIT

rm -rf "${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}/Contents/MacOS" "${BUNDLE_DIR}/Contents/Resources" "${BUILD_TMP}/modulecache"

compile_arch() {
  swiftc -O -module-cache-path "${BUILD_TMP}/modulecache" \
    -target "$1-apple-macosx${MIN_MACOS}" "${SOURCE_FILE}" -o "$2"
}

if compile_arch arm64 "${BUILD_TMP}/arm64" && compile_arch x86_64 "${BUILD_TMP}/x86_64"; then
  lipo -create "${BUILD_TMP}/arm64" "${BUILD_TMP}/x86_64" -output "${BIN}"
else
  compile_arch "$(uname -m)" "${BIN}"
fi

[ -f AppIcon.icns ] && cp AppIcon.icns "${BUNDLE_DIR}/Contents/Resources/AppIcon.icns"

cat > "${BUNDLE_DIR}/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key><string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key><string>${BUNDLE_ID}</string>
  <key>CFBundleName</key><string>${APP_NAME}</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>CFBundleShortVersionString</key><string>${VERSION}</string>
  <key>CFBundleVersion</key><string>${BUILD_NUMBER}</string>
  <key>LSMinimumSystemVersion</key><string>${MIN_MACOS}</string>
  <key>LSUIElement</key><true/>
  <key>NSHighResolutionCapable</key><true/>
  <key>CFBundleIconFile</key><string>AppIcon</string>
</dict>
</plist>
EOF

plutil -lint "${BUNDLE_DIR}/Contents/Info.plist" >/dev/null

if [ "${CODESIGN_IDENTITY}" = "-" ]; then
  codesign --force --deep --sign - "${BUNDLE_DIR}"
else
  codesign --force --deep --options runtime --timestamp --sign "${CODESIGN_IDENTITY}" "${BUNDLE_DIR}"
fi
codesign --verify --deep --strict "${BUNDLE_DIR}"

ditto -c -k --keepParent "${BUNDLE_DIR}" "${APP_NAME}-${VERSION}.zip"
shasum -a 256 "${APP_NAME}-${VERSION}.zip" > "SHA256SUMS-${VERSION}.txt"
```

### Signing tiers: ad-hoc vs Developer ID notarization

- **Internal or alpha tools (`CODESIGN_IDENTITY="-"`)**: ad-hoc signing gives macOS
  TCC a stable code structure without requiring Apple Developer certificates in CI.
  Document the one-time Gatekeeper quarantine removal in release notes:

  ```sh
  xattr -dr com.apple.quarantine /Applications/<AppName>.app
  ```

- **External or client distribution**: sign with a `Developer ID Application`
  certificate (`--options runtime --timestamp`), submit the `ditto` `.zip` with
  `xcrun notarytool submit --wait`, staple the ticket to `<AppName>.app` via
  `xcrun stapler staple`, and re-create the distributable `.zip` with `ditto`.

### Per-app tag releases in a multi-app repository

When several single-file utilities share one repository, tag each app independently
as `<app>-v<version>` (for single-app repositories, `v<version>` is sufficient) and
verify slices, signatures, and `--version` on `macos-latest` before publishing:

```yaml
name: release
on:
  push:
    tags: ["*-v[0-9]*"]
permissions:
  contents: write
jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build, verify, and publish
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          TAG="${GITHUB_REF_NAME}"
          APP="${TAG%-v*}"
          VERSION="${TAG##*-v}"
          [ -f "${APP}/tests/run.sh" ] && bash "${APP}/tests/run.sh"
          VERSION="${VERSION}" BUILD_NUMBER="${GITHUB_RUN_NUMBER}" bash "${APP}/package.sh"
          for BUNDLE in "${APP}"/*.app; do
            BIN="${BUNDLE}/Contents/MacOS/$(basename "${BUNDLE}" .app)"
            lipo -archs "${BIN}"
            codesign --verify --deep --strict "${BUNDLE}"
            "${BIN}" --version
          done
          (cd "${APP}" && shasum -a 256 ./*-"${VERSION}.zip" > "SHA256SUMS-${VERSION}.txt")
          gh release create "${TAG}" "${APP}"/*-"${VERSION}.zip" "${APP}/SHA256SUMS-${VERSION}.txt" \
            --title "${APP} v${VERSION}" --generate-notes
```
