# Refactor rules (apply to every session)
- The plan of record is REFACTORING.md. Never re-derive it; follow it.
- Relocations use `git mv` ONLY. Never write+delete to move a file.
- Verify before delete: nothing advances on assumption.
- One phase = one or more commits, phase name in the message. Commit the pure
  rename BEFORE editing a moved file's contents (keeps git rename detection clean).
- The build is the gate. After a phase: `npm run build` then `npm run lint`.
  If either is red, STOP and report — do not start the next phase.
- If a shell command is blocked ("injection detected"), run it unchained and
  unpiped, or via the phase script in scripts/refactor/. If still blocked, output
  the exact commands for the human to run and WAIT.
- When ambiguous, STOP and report. Never guess.