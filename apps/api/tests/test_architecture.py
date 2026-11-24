"""Dependency rules for the modular monolith."""

import ast
from pathlib import Path

APP = Path(__file__).parents[1] / "app"


def _imports(path: Path) -> set[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    modules: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            modules.update(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            modules.add(node.module)
    return modules


def _python_files(layer: str) -> list[Path]:
    return list((APP / layer).rglob("*.py"))


def test_domain_is_framework_and_infrastructure_independent() -> None:
    forbidden = (
        "fastapi",
        "sqlalchemy",
        "app.application",
        "app.infrastructure",
        "app.presentation",
    )
    violations = {
        str(path.relative_to(APP)): sorted(
            module for module in _imports(path) if module.startswith(forbidden)
        )
        for path in _python_files("domain")
    }
    assert not {path: imports for path, imports in violations.items() if imports}


def test_application_does_not_depend_on_http_presentation() -> None:
    violations = {
        str(path.relative_to(APP)): sorted(
            module
            for module in _imports(path)
            if module.startswith("app.presentation") or module.startswith("fastapi")
        )
        for path in _python_files("application")
    }
    assert not {path: imports for path, imports in violations.items() if imports}


def test_infrastructure_does_not_depend_on_http_presentation() -> None:
    violations = {
        str(path.relative_to(APP)): sorted(
            module for module in _imports(path) if module.startswith("app.presentation")
        )
        for path in _python_files("infrastructure")
    }
    assert not {path: imports for path, imports in violations.items() if imports}
