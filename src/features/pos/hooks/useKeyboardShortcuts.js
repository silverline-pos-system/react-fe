import { useEffect, useRef } from 'react';

/**
 * Centralised global keyboard shortcuts for the POS screen.
 *
 * This replaces the ad-hoc `window.addEventListener('keydown', ...)` block that
 * used to live inside POSScreen. It owns ONLY the function-key / chord shortcuts
 * that are safe to fire regardless of where the caret sits (F-keys never type a
 * character). Printable-key, cart-context shortcuts (arrows, +, -, Del, E) are
 * handled inside ControlPanel's search input instead, so they never fight the
 * cashier while they are typing a search term.
 *
 * Design rules honoured here:
 *  - One listener, cleaned up on unmount (no leaks, no duplicate handlers).
 *  - While a blocking modal is open only Escape is live (delegated to onEscape);
 *    every other shortcut is suppressed so dialogs keep control of the keyboard.
 *  - Nothing fires unless `enabled` (an open shift) is true.
 *  - The `\` cash shortcut is suppressed while a text field is focused so it can
 *    still be typed into notes/reference fields.
 *  - After an idle keypress focus is returned to the scan box, so the cashier can
 *    keep scanning without reaching for the mouse.
 *
 * @param {Object}   cfg
 * @param {boolean}  cfg.enabled       Shift is open — shortcuts are live.
 * @param {boolean}  cfg.isModalOpen   A blocking modal is open (Escape only).
 * @param {Function} cfg.onEscape      Called on Escape while a modal is open.
 * @param {Object}   cfg.handlers      Map of named actions (see below).
 * @param {Function} [cfg.refocusSearch] Return focus to the scan box when idle.
 */
export function useKeyboardShortcuts({ enabled, isModalOpen, onEscape, handlers, refocusSearch }) {
    // Keep the latest callbacks in a ref so the listener is attached once and
    // never rebinds on every render (avoids churn and duplicate handlers). The
    // ref is refreshed in an effect (not during render) each time inputs change.
    const ref = useRef({ enabled, isModalOpen, onEscape, handlers, refocusSearch });
    useEffect(() => {
        ref.current = { enabled, isModalOpen, onEscape, handlers, refocusSearch };
    });

    useEffect(() => {
        const isTextField = () => {
            const el = document.activeElement;
            if (!el) return false;
            return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable;
        };

        const onKeyDown = (e) => {
            const { enabled, isModalOpen, onEscape, handlers, refocusSearch } = ref.current;

            // While a modal owns the screen, only Escape is live here.
            if (isModalOpen) {
                if (e.key === 'Escape') onEscape?.();
                return;
            }

            if (!enabled) return;

            switch (e.key) {
                case 'F1': e.preventDefault(); handlers.priceCheck?.(); return;
                case 'F2': e.preventDefault(); handlers.focusSearch?.(); return;
                case 'F3': e.preventDefault(); handlers.recall?.(); return;
                case 'F4': e.preventDefault(); handlers.cancel?.(); return;
                case 'F6': e.preventDefault(); handlers.paidIn?.(); return;
                case 'F7': e.preventDefault(); handlers.paidOut?.(); return;
                case 'F8': e.preventDefault(); handlers.hold?.(); return;
                case 'F9': e.preventDefault(); handlers.discount?.(); return;
                case 'F10': e.preventDefault(); handlers.payCard?.(); return;
                case 'F11': e.preventDefault(); handlers.payQr?.(); return;
                case '\\':
                    // Cash shortcut — but let it type into text fields (e.g. notes).
                    if (!isTextField()) { e.preventDefault(); handlers.payCash?.(); }
                    return;
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) { e.preventDefault(); handlers.payCash?.(); }
                    return;
                default:
                    break;
            }

            // Idle keypress with focus adrift: pull it back to the scan box so the
            // next scan/keystroke lands in the right place. Never steal focus from
            // a field the cashier deliberately clicked into.
            if (!isTextField()) refocusSearch?.();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
}

export default useKeyboardShortcuts;
