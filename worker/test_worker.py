import subprocess
import unittest
from pathlib import Path
from unittest.mock import patch

import requests
import trellis_worker as worker


class WorkerTests(unittest.TestCase):
    def test_command_preserves_arguments_without_shell_execution(self):
        with patch.object(worker.subprocess, "run") as run:
            worker.run_trellis(
                "python infer.py --image {input} --output {output} --prompt {prompt}",
                Path("image with spaces.png"),
                Path("result.glb"),
                "$(touch /tmp/unsafe); 'quoted'",
            )
        run.assert_called_once_with(
            [
                "python",
                "infer.py",
                "--image",
                "image with spaces.png",
                "--output",
                "result.glb",
                "--prompt",
                "$(touch /tmp/unsafe); 'quoted'",
            ],
            check=True,
            timeout=600,
        )

    def test_command_timeout(self):
        with (
            patch.object(
                worker.subprocess,
                "run",
                side_effect=subprocess.TimeoutExpired("infer", 600),
            ),
            self.assertRaises(subprocess.TimeoutExpired),
        ):
            worker.run_trellis("python infer.py", Path("a.png"), Path("a.glb"), None)

    def test_success_uploads_result_and_completes_claim(self):
        job = {
            "jobId": "test",
            "receiptHandle": "receipt",
            "inputUrl": "input",
            "outputUrl": "output",
        }

        def inference(_command, _input, output, _prompt):
            output.write_bytes(b"glTF" + b"test-output")

        with (
            patch.object(worker, "request_json", return_value={"job": job}),
            patch.object(worker, "report_progress"),
            patch.object(worker, "download"),
            patch.object(worker, "run_trellis", side_effect=inference),
            patch.object(worker, "upload") as upload,
            patch.object(worker, "complete") as complete,
        ):
            self.assertTrue(
                worker.process_one("https://app.example", "token", "ec2-test", "infer")
            )
        self.assertEqual(upload.call_args.args[0], "output")
        self.assertEqual(complete.call_args.args[2:4], ("test", "receipt"))
        self.assertTrue(complete.call_args.kwargs["ok"])
        self.assertEqual(complete.call_args.kwargs["glb_bytes"], 15)

    def test_transfer_failure_does_not_expose_signed_url(self):
        job = {"jobId": "test", "receiptHandle": "receipt", "inputUrl": "secret-url"}
        with (
            patch.object(worker, "request_json", return_value={"job": job}),
            patch.object(worker, "report_progress"),
            patch.object(
                worker, "download", side_effect=requests.HTTPError("secret-url")
            ),
            patch.object(worker, "complete") as complete,
        ):
            worker.process_one("https://app.example", "token", "ec2-test", "infer")
        self.assertFalse(complete.call_args.kwargs["ok"])
        self.assertNotIn("secret-url", complete.call_args.kwargs["error"])

    def test_uncertain_completion_does_not_mark_output_failed(self):
        job = {
            "jobId": "test",
            "receiptHandle": "receipt",
            "inputUrl": "input",
            "outputUrl": "output",
        }

        def inference(_command, _input, output, _prompt):
            output.write_bytes(b"glTF-test")

        with (
            patch.object(worker, "request_json", return_value={"job": job}),
            patch.object(worker, "report_progress"),
            patch.object(worker, "download"),
            patch.object(worker, "run_trellis", side_effect=inference),
            patch.object(worker, "upload"),
            patch.object(
                worker, "complete", side_effect=requests.ConnectionError
            ) as complete,
            self.assertRaises(requests.ConnectionError),
        ):
            worker.process_one("https://app.example", "token", "ec2-test", "infer")
        complete.assert_called_once()
        self.assertTrue(complete.call_args.kwargs["ok"])

    def test_idle_exit_only_after_empty_queue(self):
        with (
            patch(
                "sys.argv", ["worker", "--token", "test", "--idle-exit-seconds", "30"]
            ),
            patch.object(worker, "process_one", return_value=False) as process,
            patch.object(worker.time, "monotonic", side_effect=[0, 31]),
        ):
            self.assertEqual(worker.main(), 0)
        process.assert_called_once()

    def test_api_outage_is_not_treated_as_empty_queue(self):
        with (
            patch(
                "sys.argv", ["worker", "--token", "test", "--idle-exit-seconds", "30"]
            ),
            patch.object(
                worker, "process_one", side_effect=requests.ConnectionError
            ) as process,
            patch.object(worker.time, "sleep"),
        ):
            self.assertEqual(worker.main(), 1)
        self.assertEqual(process.call_count, 5)

    def test_completed_job_resets_idle_timer(self):
        with (
            patch(
                "sys.argv", ["worker", "--token", "test", "--idle-exit-seconds", "30"]
            ),
            patch.object(
                worker, "process_one", side_effect=[True, False, False]
            ) as process,
            patch.object(worker.time, "monotonic", side_effect=[0, 100, 110, 131]),
            patch.object(worker.time, "sleep"),
        ):
            self.assertEqual(worker.main(), 0)
        self.assertEqual(process.call_count, 3)


if __name__ == "__main__":
    unittest.main()
