# Stay Focused - Disable Visibility API

This Firefox add-on prevents websites from detecting when you switch tabs or minimize the browser by disabling the Page Visibility API. Useful for keeping music playing, dashboards updating, and monitoring pages active even when not in focus.

## Qick start 
Just download it from https://addons.mozilla.org/en-US/firefox/addon/stay-focused-addon/

## Features
- Disables `document.hidden`, `document.visibilityState`, and `document.webkitHidden`
- Independently blocks Visibility API changes and `blur` events
- Master toggle with separate controls for each protection
- Per-domain rules can block, allow, or inherit the global setting for each API

## Domain rules

Each domain can override Visibility API and Blur independently:

- Green `Allow` lets the domain receive that signal normally
- Gray `Global` inherits the master toggle and global API setting
- Red `Deny` blocks that signal for the domain

Rules also apply to subdomains. A more specific domain rule takes priority

## Icon Attribution
The extension icon is a derivative of ["Eye SVG Vector"](https://www.svgrepo.com/svg/501558/eye) from the Instructure UI Line Interface Icons collection, used under the MIT License.
