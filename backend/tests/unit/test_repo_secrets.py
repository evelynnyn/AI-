"""SEC-03 AC3: keys stay out of Git and out of the frontend."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SECRET_NAMES = ("SERVICE_ROLE", "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GROQ_API_KEY")


def test_sec03_ac3_env_files_are_ignored_by_git() -> None:
    for path in ("backend/.env", "frontend/.env.local", "frontend/.env"):
        result = subprocess.run(["git", "check-ignore", "-q", path], cwd=ROOT, check=False)
        assert result.returncode == 0, f"{path} is not ignored by Git"
    tracked = subprocess.run(
        ["git", "ls-files", "*.env", "*.env.local", "**/.env", "**/.env.local"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    assert tracked == ""


def test_sec03_ac3_frontend_never_mentions_server_keys() -> None:
    frontend = ROOT / "frontend"
    files = [
        *(frontend / "src").rglob("*.ts"),
        *(frontend / "src").rglob("*.tsx"),
        frontend / ".env.example",
    ]
    for file in files:
        text = file.read_text(encoding="utf-8")
        for name in SECRET_NAMES:
            assert name not in text, f"{name} appears in {file.relative_to(ROOT)}"
