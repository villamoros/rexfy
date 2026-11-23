import unittest

from check_slo import evaluate, percentile


class SloTest(unittest.TestCase):
    def test_nearest_rank_percentile(self) -> None:
        self.assertEqual(percentile([10, 30, 20, 40], 0.95), 40)

    def test_failed_availability_consumes_budget(self) -> None:
        config = {
            "services": {"api": {"availability": 0.9, "latency_p95_ms": 100}}
        }
        samples = [
            {"service": "api", "success": True, "duration_ms": 90},
            {"service": "api", "success": False, "duration_ms": 10},
        ]
        result = evaluate(config, samples)["api"]
        self.assertEqual(result["status"], "fail")
        self.assertGreater(result["error_budget_consumed"], 1)

    def test_stale_outbox_fails_even_when_probe_is_available(self) -> None:
        config = {
            "services": {"outbox": {"availability": 0.99, "oldest_pending_max_seconds": 300}}
        }
        samples = [
            {
                "service": "outbox",
                "success": True,
                "duration_ms": 1,
                "oldest_pending_seconds": 301,
            }
        ]
        result = evaluate(config, samples)["outbox"]
        self.assertEqual(result["status"], "fail")


if __name__ == "__main__":
    unittest.main()
