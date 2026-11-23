"""Evaluate availability and p95 samples against ops/slo.json."""

import argparse
import json
import math
from pathlib import Path


def percentile(values: list[float], quantile: float) -> float:
    ordered = sorted(values)
    return ordered[max(0, math.ceil(len(ordered) * quantile) - 1)]


def evaluate(config: dict, samples: list[dict]) -> dict:
    results: dict[str, dict] = {}
    for name, objective in config["services"].items():
        observed = [sample for sample in samples if sample["service"] == name]
        if not observed:
            results[name] = {"status": "no_data"}
            continue
        availability = sum(bool(item["success"]) for item in observed) / len(observed)
        allowed_failures = 1 - objective["availability"]
        consumed = (1 - availability) / allowed_failures if allowed_failures else 0
        result = {
            "status": "pass" if availability >= objective["availability"] else "fail",
            "availability": availability,
            "error_budget_consumed": consumed,
            "samples": len(observed),
        }
        durations = [float(item["duration_ms"]) for item in observed if item.get("success")]
        if "latency_p95_ms" in objective and durations:
            result["latency_p95_ms"] = percentile(durations, 0.95)
            if result["latency_p95_ms"] > objective["latency_p95_ms"]:
                result["status"] = "fail"
        pending_ages = [
            float(item["oldest_pending_seconds"])
            for item in observed
            if "oldest_pending_seconds" in item
        ]
        if "oldest_pending_max_seconds" in objective and pending_ages:
            result["oldest_pending_seconds"] = max(pending_ages)
            if result["oldest_pending_seconds"] > objective["oldest_pending_max_seconds"]:
                result["status"] = "fail"
        results[name] = result
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("samples", type=Path)
    parser.add_argument("--config", type=Path, default=Path("ops/slo.json"))
    args = parser.parse_args()
    results = evaluate(json.loads(args.config.read_text()), json.loads(args.samples.read_text()))
    print(json.dumps(results, indent=2, sort_keys=True))
    if any(result["status"] != "pass" for result in results.values()):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
