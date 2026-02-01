// Native platforms don't need the WebSidebar - it's web-only
// This empty component prevents the web-specific code from being bundled on native

export function WebSidebar() {
  return null;
}
