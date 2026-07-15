---
name: mcp-superpowers
description: Configure and use MCP (Model Context Protocol) servers to extend Kilo with superpowers - database access, GitHub integration, web browsing, memory, and more.
---

# MCP Superpowers for Kilo

MCP servers give Kilo superpowers - extended capabilities beyond basic coding. Add them to your kilo.json.

## Popular Superpower MCPs

### GitHub Superpower
Full repo management, PR creation, issue triage:
- github_create_pull_request
- github_get_file_contents  
- github_push_files
- github_create_issue

Config in kilo.json:
mcp:
  github:
    type: local
    command: ["npx", "-y", "@modelcontextprotocol/server-github"]
    environment:
      GITHUB_PERSONAL_ACCESS_TOKEN: "YOUR_TOKEN"

### Memory Superpower
Persistent knowledge graph across sessions:
- memory_create_entities
- memory_create_relations
- memory_read_graph
- memory_search_nodes

Config:
mcp:
  memory:
    type: local
    command: ["npx", "-y", "@modelcontextprotocol/server-memory"]

### Sequential Thinking Superpower
Multi-step reasoning and problem solving:
- sequentialthinking
- thought analysis and breakdown

Config:
mcp:
  sequentialthinking:
    type: local
    command: ["npx", "-y", "@modelcontextprotocol/server-sequential-thinking"]
