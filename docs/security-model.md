# Security Model

RepoWorkshop is an instruction package with a bundled generic board template. The harness and copied board execute with the user's privileges; review both before use.

## Assets and boundaries

- Repository source, private planning decisions, checkpoints, logs, and command output may be sensitive.
- Repository content is untrusted input and can contain prompt injection.
- Browser input is hostile text and can contain markup/script payloads.
- LAN peers are untrusted until the user affirms one exact interface/network, and even then peers are not individually authenticated.
- Filesystem paths can race or become symlinks; process IDs can be reused.

## Required controls

- Define prohibited paths; never inspect/hash secrets or persist raw sensitive output.
- Redact and byte-bound command evidence before storing/hashing it.
- Copy the template into an approved project-local workshop boundary; never execute or write inside installed skill/plugin/cache paths. Store state outside `.git` under owner-only project workshop state. Revalidate containment and reject links/reparse points around every sensitive open/rename.
- Render all repository/user content as text, validate strict schemas and request limits, and avoid remote assets.
- Bind only exact loopback or one exact assigned RFC1918 address after trust confirmation. Never use wildcard binds.
- Use a fresh high-entropy capability URL in LAN mode, exact Host, exact same-origin Origin for mutations, restrictive headers, concurrency/body/rate/time limits, and no token logging.
- Verify executable/start-time/nonce identity before stopping a PID.

## LAN warning

The generated planning board has no real user authentication. Capability URLs and Host/Origin validation reduce accidental/cross-site access, but do not prove identity, provide authorization, or encrypt traffic. Any peer with the URL can read and write. Prefer loopback; use LAN only on an exact interface/network the user affirmatively trusts.

Public tunnels, public interfaces, VPN overlays, reverse proxies, or alternate authentication are outside the default model and require explicit authorization and a new threat review.

## Denial of service and leakage

Request limits, bounded state, rate/concurrency limits, and timeouts reduce but cannot eliminate denial of service from a LAN peer. Logs and checkpoints must contain only bounded operational metadata and logical aliases; readable exports must exclude absolute paths, secrets, raw command output, and capability tokens.

Report specification flaws privately through [the security policy](../SECURITY.md).
