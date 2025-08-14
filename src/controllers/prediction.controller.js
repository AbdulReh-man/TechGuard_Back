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
      pythonPath: "python3",
      scriptPath: "./utils",
      args: [text],
      stderr: true,
    };

    console.log("PythonShell options:", options);

    let pyshell = new PythonShell("predict.py", options);
    let output = "";
    let errorOutput = "";

    pyshell.on("message", (message) => {
      console.log("Python stdout:", message);
      output += message;
    });

    pyshell.stderr.on("data", (data) => {
      console.error("Python stderr:", data.toString());
      errorOutput += data.toString();
    });

    pyshell.end((err) => {
      if (err) {
        console.error("PythonShell Error:", err);
        return res
          .status(500)
          .json({ error: "Prediction failed", details: err.message });
      }

      if (errorOutput) {
        console.error("Python script error output:", errorOutput);
      }

      if (!output.trim()) {
        return res
          .status(500)
          .json({ error: "No output from prediction script" });
      }

      try {
        const prediction = JSON.parse(output.trim());
        res.json(prediction);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError.message);
        res
          .status(500)
          .json({
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
