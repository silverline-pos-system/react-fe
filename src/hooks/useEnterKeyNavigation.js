import { useCallback } from 'react';

/**
 * Custom hook for handling Enter key navigation in forms
 * Moves focus to the next input field when Enter is pressed
 * Optionally triggers a callback when Enter is pressed on the last field
 * 
 * @param {Function} onLastFieldEnter - Optional callback to execute when Enter is pressed on the last field
 * @returns {Function} handleKeyDown - Event handler to attach to form fields
 */
export const useEnterKeyNavigation = (onLastFieldEnter = null) => {
    const handleKeyDown = useCallback((e) => {
        // Only handle Enter key on input elements (not buttons)
        if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
            e.preventDefault();

            // Get the form element
            const form = e.target.form;
            if (!form) return;

            // Get all focusable input elements (exclude buttons)
            const focusableElements = Array.from(
                form.querySelectorAll(
                    'input:not([disabled]):not([type="button"]):not([type="submit"]):not([type="reset"]), ' +
                    'select:not([disabled]), ' +
                    'textarea:not([disabled])'
                )
            );

            // Find current element index
            const currentIndex = focusableElements.indexOf(e.target);
            const nextIndex = currentIndex + 1;

            // Move to next element or trigger callback on last field
            if (nextIndex < focusableElements.length) {
                focusableElements[nextIndex].focus();
            } else if (onLastFieldEnter && typeof onLastFieldEnter === 'function') {
                // At the last field, trigger the callback (e.g., save/submit)
                onLastFieldEnter();
            }
        }
    }, [onLastFieldEnter]);

    return handleKeyDown;
};

export default useEnterKeyNavigation;
