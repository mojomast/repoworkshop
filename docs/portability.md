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

Writable bundled-board persistence requires Node.js `O_DIRECTORY`/`O_NOFOLLOW` and a descriptor directory path that can be verified against the opened inode. Linux uses `/proc/self/fd`; a compatible `/dev/fd` equivalent is detected rather than assumed. Platforms without either fail closed for state reads/writes instead of claiming path-race safety. They may run `REPOWORKSHOP_READ_ONLY=1` on exact loopback for a synthesized, non-persisted manual review board; PUT is rejected clearly. Native Windows and unsupported POSIX systems can still perform research/planning. This package intentionally does not overclaim universal writable hosting.

The [bundled board](board-template.md) requires a maintained Node.js release but no downloaded packages. Harnesses that can materialize linked skill resources should copy the whole board tree to a project-local workshop directory and run its built-in tests there. A harness that cannot materialize or execute it must fail closed at that boundary; it may deliver an artifact and manual loopback instructions but cannot claim hosting or runtime validation.
