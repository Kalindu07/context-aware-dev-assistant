# Privacy documentation

Privacy threat model, data minimisation rules, and redaction policies.

Hard rules for captured events:
- Do **not** store raw source code
- Do **not** store passwords, tokens, or credentials
- Do **not** store unnecessary sensitive browser information (cookies, form values, full page content)
- Prefer coarse metadata (language id, file extension, host category)
- Primary filtering occurs in extension `privacy/` modules; backend applies defence-in-depth checks
