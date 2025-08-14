import express from "express"
const router = express.Router();
import {exec} from "child_process"
router.route("/predict").get((req, res) => {
  const review = req.query.review;
  if (!review) return res.status(400).json({ error: "Review is required" });

  const command = `python3 ./utils/predict.py "${review.replace(/"/g, '\\"')}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Execution error:", error);
      return res.status(500).json({ error: "Failed to run script" });
    }

    if (stderr) {
      console.error("Script error output:", stderr);
    }

    // Get the last line of stdout
    const outputLines = stdout.trim().split("\n");
    const lastLine = outputLines[outputLines.length - 1];

    try {
      const parsed = JSON.parse(lastLine); // ← parse JSON string
      res.status(200).json(parsed);         // ← send parsed JSON
    } catch (err) {
      console.error("Failed to parse output:", err);
      res.status(500).json({ error: "Invalid output from script" });
    }
  });
});

export default router;
