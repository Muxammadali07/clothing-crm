## graphify

This project has a code-only knowledge graph at graphify-out/ (local AST, no LLM).

- When graphify-out/graph.json exists, run `graphify query "<question>"` before grepping or reading source for a codebase question. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for a single concept; read raw files only for lines the graph located.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
