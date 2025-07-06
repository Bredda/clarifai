---
title: ClarifAI
emoji: 📢
colorFrom: yellow
colorTo: green
sdk: docker
pinned: true
app_port: 3000
short_description: Empowering your critical thinking with AI
---

```mermaid
graph TD

A[🧑‍💻 Utilisateur] -->|Contenu soumis| B(SimpleInvite)

B -->|onSubmit| C[clarify() dans Zustand]

C -->|POST| D[/api/clarify (Next.js route)]

D -->|invoke()| E[LangGraph - graph.invoke()]

E -->|GraphEvents + streaming| F[SSE -> Response.write()]

F -->|SSE via fetch-event-source| G[createGraphStream()]

G -->|onEvent| H[handleGraphEvent(event)]

H -->|mise à jour| I[Zustand Store (chunks, biais, claims)]

I -->|sélecteurs| J[UI React (ResultPanel, etc.)]

```
