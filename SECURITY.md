# Security Policy

## Supported versions

Security fixes are provided for the latest released minor version. The current supported line is `0.5.x`.

## Report a vulnerability

Use [GitHub Security Advisories](https://github.com/mojomast/repoworkshop/security/advisories/new) to report vulnerabilities privately. Include the affected files/version, impact, reproduction steps, and suggested mitigation when available. Do not include real credentials, private repository content, or sensitive board state.

If private advisory reporting is unavailable, open a minimal [public issue](https://github.com/mojomast/repoworkshop/issues/new) requesting a private contact path without publishing exploit details.

Please allow a reasonable time for triage and remediation before disclosure. Maintainers will acknowledge, assess scope, coordinate a fix, and credit reporters who want attribution.

## Scope

Relevant reports include unsafe skill instructions, path/symlink escapes, secret leakage, canonical-state confusion, Host/Origin/CSRF weaknesses, capability-token exposure, unsafe network defaults, plugin/package integrity problems, or validation bypasses.

This repository bundles a standalone dependency-free board server template. It is intended to be copied into an approved project-local boundary and is not an authenticated, encrypted, multi-user, public, or denial-of-service-resistant service. Reports about the template, generated adaptations, or the surrounding skill contracts are in scope; include enough generated implementation detail to distinguish them.

Review [the documented security model](docs/security-model.md) before deployment. LAN controls are defense-in-depth and are not real authentication or encryption.
