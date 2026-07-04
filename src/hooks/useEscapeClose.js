import { useEffect } from 'react';

/**
 * Hook that calls `onClose` when the Escape key is pressed.
 * Attach to any modal/dialog to enable keyboard dismissal.
 *
 * @param {Function} onClose - Callback to close the modal
 * @param {boolean} [enabled=true] - Whether the listener is active
 */
export default function useEscapeClose(onClose, enabled = true) {
    useEffect(() => {
        if (!enabled || !onClose) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, enabled]);
}
