// //const { PythonShell } = require('python-shell');
// import {PythonShell} from "python-shell"


// const predictNews = async (req, res) => {
//   try {
//     const { text } = req.body;
//     console.log(req.body.text);
    
//     if (!text) {
//       return res.status(400).json({ error: 'Text input is required' });
//     }

//     const options = {
//       mode: 'text',
//       pythonPath:  './venv/bin/python', // Mac/Linux
//       scriptPath: './utils',
//       args: [text],
//       stderr: true
//     };
// console.log(options);



//     PythonShell.run('predict.py', options, (err, results) => {
//       console.log("Back from Python");
//       console.log("Results:", results);
//       console.log("helo");
      
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ error: 'Prediction failed' });
//       }
      
//       try {
//         console.log("hello");
        
//         const prediction = JSON.parse(results[0]);
//         console.log(prediction);
        
//         res.json(prediction);
//       } catch (parseError) {
//         console.error(parseError);
//         res.status(500).json({ error: 'Failed to parse prediction' });
//       }
//     });
    
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// };

// export { predictNews };

import { PythonShell } from "python-shell";

const predictNews = async (req, res) => {
  try {
    const { text } = req.body;

    console.log("Received text:", text);

    if (!text) {
      return res.status(400).json({ error: "Text input is required" });
    }

    const options = {
      mode: "text",
      pythonPath: "./venv/bin/python", // Adjust path based on your OS/environment
      scriptPath: "./utils",
      args: [text],
      stderr: true, // Include stderr output for error handling
    };

    console.log("PythonShell options:", options);

    PythonShell.run("predict.py", options, (err, results) => {
      console.log("Returned from Python script");
      console.log("Raw results:", results);

      if (err) {
        console.error("PythonShell Error:", err);
        return res.status(500).json({
          error: "Prediction failed",
          details: err.message || "Unknown Python error",
        });
      }

      if (!results || results.length === 0) {
        console.error("No output received from Python script");
        return res.status(500).json({
          error: "No output from prediction script",
        });
      }

      try {
        const cleanedOutput = results[0].trim();
        console.log("Cleaned output:", cleanedOutput);

        const prediction = JSON.parse(cleanedOutput);
        console.log("Parsed Prediction:", prediction);

        res.json(prediction);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError.message);
        res.status(500).json({
          error: "Failed to parse prediction",
          details: parseError.message,
        });
      }
    });
  } catch (error) {
    console.error("Server Error:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

export { predictNews };
