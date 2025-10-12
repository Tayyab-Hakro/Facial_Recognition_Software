import express from "express";
import multer from "multer";
import path from "path";
import cors from "cors";
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ✅ Ensure uploads directory exists
const uploadDir = "./uploads/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Route to forward images to Python
app.post("/addguards", upload.array("images", 3), async (req, res) => {
  try {
    const { name } = req.body;
    const files = req.files;

    if (!name || !files || files.length === 0) {
      return res.status(400).json({ success: false, message: "Name or images missing" });
    }

    console.log(`✅ Received from frontend: ${name} (${files.length} images)`);

    const formData = new FormData();
    formData.append("name", name);
    files.forEach((file) => {
      formData.append("images", fs.createReadStream(file.path));
    });

    const response = await axios.post("http://127.0.0.1:5000/save_images", formData, {
      headers: formData.getHeaders(),
    });

    res.json({
      success: true,
      message: "Data sent successfully to Python server",
      pythonResponse: response.data,
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Node.js Server running on port ${PORT}`);
});
