# Portability and Capabilities

The skill uses only Agent Skills standard frontmatter: `name`, `description`, `license`, `compatibility`, and string-valued `metadata`.

## Required harness capabilities

- Bounded repository and instruction-file reads
- Safe Git/status/history inspection
- SHA-256 and strict canonical JSON
- User-approved isolated writes and private state storage

Without any required capability, stop at that boundary and report what is missing.

## Optional capabilities and fallback

| Capability | Preferred behavior | Fallback |
| --- | --- | --- |
| Delegation | Parallel non-overlapping lanes | Run identical lanes sequentially |
| Process/network | Launch exact-address isolated board | Produce artifact and manual loopback procedure, or stop |
| Confirmation prompt | Confirm exact LAN trust | Do not expose to LAN; offer loopback |
| Browser automation | Keyboard/mobile/accessibility checks | Report a manual checklist as unexecuted |
| External web research | Authorized primary-source lane | Omit EX and record the exclusion |

Harness permission configuration is not assumed enforcement. The agent checks actual abilities and approvals at each side-effect boundary.

## Platforms

Full workflow support targets POSIX/Linux, macOS, and WSL with implemented exact-interface inspection, POSIX owner-only modes, same-directory atomic rename, and process identity. Native Windows can perform research/planning, but state writes/hosting require documented equivalents for ACLs, reparse-point defenses, atomic replacement, interface selection, and process identity; otherwise stop before those phases. This package intentionally does not overclaim universal hosting behavior.
