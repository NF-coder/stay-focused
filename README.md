# Stay Focused - Disable Visibility API

This Firefox add-on prevents websites from detecting when you switch tabs or minimize the browser by disabling the Page Visibility API. Useful for keeping music playing, dashboards updating, and monitoring pages active even when not in focus.

## Qick start (until add-on published)
1. Go to [`about:debugging#/runtime/this-firefox`](about:debugging#/runtime/this-firefox)
2. `Load temporary add-on`
3. Select `manifest.json`
4. Extenson will be avilable during this session

## Features
- Disables `document.hidden`, `document.visibilityState`, and `document.webkitHidden`
- Blocks `visibilitychange`, `webkitvisibilitychange`, `blur`, and `focus` events
- Simple toggle interface with visual feedback

## Icon Attribution
The extension icon is a derivative of ["Eye SVG Vector"](https://www.svgrepo.com/svg/501558/eye) from the Instructure UI Line Interface Icons collection, used under the MIT License.
