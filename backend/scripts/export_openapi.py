"""Write the OpenAPI spec to backend/openapi.json for `npm run gen:api` in frontend/."""

import json
import os
import sys
from pathlib import Path

# The spec does not depend on real credentials.
os.environ.setdefault("SUPABASE_URL", "http://127.0.0.1:54321")
os.environ.setdefault("SUPABASE_ANON_KEY", "unused")

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app  # noqa: E402

output = backend_dir / "openapi.json"
output.write_text(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {output}")
