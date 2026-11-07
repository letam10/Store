export function closeDropdownMenus() {
  if (typeof window === 'undefined') return
  const EventConstructor = window.Event || globalThis.Event
  if (typeof EventConstructor === 'function') window.dispatchEvent(new EventConstructor('storefront:dropdown-close'))
}
