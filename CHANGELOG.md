# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-06-15

### Fixed
- Changed default `bin` entry to `cli-node.js` for better npm compatibility
- Users can now run `chris` command without requiring Bun

## [1.0.0] - 2025-06-14

### Added
- Initial release
- Persistent memory system with SQLite FTS5
- Session checkpoint (`/checkpoint`)
- Task tree management (`/task`)
- Security audit scanner (`/audit`)
- LAN collaboration mode (`/collab`)
- Dream & Distill knowledge extraction (`/dream`, `/distill`)
- Multi-provider support (Anthropic, OpenAI, Gemini, Grok)
- 60+ built-in tools
- React Ink terminal UI

### Changed
- Based on claude-code-best with additional features

[1.0.1]: https://github.com/SuCriss/chris-code/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/SuCriss/chris-code/releases/tag/v1.0.0
