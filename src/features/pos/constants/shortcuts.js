/**
 * POS keyboard shortcut reference — single source of truth for the on-screen help
 * overlay (ShortcutHelpModal) and documentation.
 *
 * This file is display metadata only. The keys are wired to actions in
 * `useKeyboardShortcuts` (global function keys) and in `ControlPanel`
 * (cart-context keys that must yield to the search field while typing).
 *
 * Keep this list in sync when adding or changing a shortcut so the help
 * overlay never drifts from the real behaviour.
 */

export const SHORTCUT_GROUPS = [
    {
        title: 'Sale',
        items: [
            { keys: ['Scan / Type'], label: 'Add product by barcode, SKU or name' },
            { keys: ['F2'], label: 'Focus the product search box' },
            { keys: ['Enter'], label: 'Add highlighted result (or open Cash pay when search is empty)' },
            { keys: ['F3'], label: 'Recall a held bill' },
            { keys: ['F8'], label: 'Hold / park the current bill' },
            { keys: ['F4'], label: 'Cancel the whole transaction' },
        ],
    },
    {
        title: 'Cart (when the search box is empty)',
        items: [
            { keys: ['↑', '↓'], label: 'Select the previous / next cart line' },
            { keys: ['+', '='], label: 'Increase quantity of the selected line' },
            { keys: ['−'], label: 'Decrease quantity of the selected line' },
            { keys: ['*'], label: 'Type an exact quantity for the selected line' },
            { keys: ['Del'], label: 'Void the selected line' },
        ],
    },
    {
        title: 'Payment',
        items: [
            { keys: ['\\'], label: 'Pay with Cash' },
            { keys: ['Ctrl', 'Enter'], label: 'Pay with Cash' },
            { keys: ['F10'], label: 'Pay with Card' },
            { keys: ['F11'], label: 'Pay with QR' },
            { keys: ['F9'], label: 'Apply a discount' },
            { keys: ['↑', '↓'], label: 'Switch payment method (in payment screen)' },
            { keys: ['Enter'], label: 'Add tendered amount, then complete the sale' },
        ],
    },
    {
        title: 'Cash drawer & tools',
        items: [
            { keys: ['F1'], label: 'Price check' },
            { keys: ['F6'], label: 'Paid In' },
            { keys: ['F7'], label: 'Paid Out' },
        ],
    },
    {
        title: 'General',
        items: [
            { keys: ['?'], label: 'Show / hide this shortcut help' },
            { keys: ['Esc'], label: 'Close a dialog or cancel the current action' },
        ],
    },
];

export default SHORTCUT_GROUPS;
