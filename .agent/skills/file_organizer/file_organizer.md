---
name: File Organizer
description: This skill is used to organize files in a directory. It is used to maintain a consistent project structure and to ensure that all files are in the correct location. When we change any direction in project implementation, this skill will be used to update the file structure.
---

# Project Structure and file organization skill

## Usage
- When making changes to the project structure or database schema, ensure that all relevant files in the `docs/` folder—including the PRD, Design, and Technical documentation—are updated to remain synchronized with the current implementation.
- When generating a new checkpoint in the `docs/checkpoints/` directory, identify the most recent existing checkpoint file. Use its content as the baseline for the new checkpoint to ensure that incremental updates are accurately captured and the versioning sequence is strictly maintained. The checkpoint should be named in the format `cp_yyyymmdd_hhmm.md`.
