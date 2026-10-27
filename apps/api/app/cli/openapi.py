"""Writes the API's OpenAPI schema, which the web app turns into TypeScript types.

Run from apps/api:  uv run python -m app.cli.openapi openapi.json
CI fails when the committed file is out of date.
"""

import json
import sys

from app.main import app


def main() -> None:
    schema = json.dumps(app.openapi(), ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if len(sys.argv) > 1:
        with open(sys.argv[1], "w", encoding="utf-8") as out:
            out.write(schema)
    else:
        sys.stdout.write(schema)


if __name__ == "__main__":
    main()
