import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

function Attendance() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [opencvReady, setOpencvReady] = useState(false);
  const [recognizedName, setRecognizedName] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // ✅ Wait for OpenCV.js to load
  useEffect(() => {
    const check = setInterval(() => {
      if (window.cv && window.cv.FS_createDataFile) {
        clearInterval(check);
        setOpencvReady(true);
        console.log("✅ OpenCV.js is ready");
      }
    }, 100);
  }, []);

  // ✅ Start or stop the camera
  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        setIsCameraOn(true);
        setRecognizedName("");
      } catch (error) {
        console.error("Camera Error:", error);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setRecognizedName("");
    }
  };

  // ✅ Face detection overlay using OpenCV.js
  useEffect(() => {
    if (!isCameraOn || !opencvReady) return;

    const cv = window.cv;
    const faceCascade = new cv.CascadeClassifier();

    const loadCascade = async () => {
      try {
        const file = "haarcascade_frontalface_default.xml";
        const response = await fetch(file);
        if (!response.ok) throw new Error("Cascade file not found!");
        const data = await response.arrayBuffer();
        const bytes = new Uint8Array(data);

        try {
          cv.FS_unlink(`/${file}`);
        } catch (e) {}

        cv.FS_createDataFile("/", file, bytes, true, false, false);
        faceCascade.load(file);
        console.log("✅ Haar cascade loaded");
        detectFace();
      } catch (error) {
        console.error("❌ Error loading cascade:", error);
      }
    };

    const detectFace = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const process = () => {
        if (!isCameraOn) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = cv.imread(canvas);
        const gray = new cv.Mat();
        cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY, 0);

        const faces = new cv.RectVector();
        faceCascade.detectMultiScale(gray, faces, 1.1, 6, 0);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "lime";
        ctx.font = "18px Arial";
        ctx.fillStyle = "lime";

        for (let i = 0; i < faces.size(); i++) {
          const face = faces.get(i);
          ctx.beginPath();
          ctx.rect(face.x, face.y, face.width, face.height);
          ctx.stroke();

          if (recognizedName) {
            ctx.fillText(recognizedName, face.x, face.y - 10);
          }
        }

        img.delete();
        gray.delete();
        faces.delete();

        requestAnimationFrame(process);
      };

      process();
    };

    loadCascade();
  }, [isCameraOn, opencvReady, recognizedName]);

  // ✅ Capture frame and send to Flask backend
  const captureAndCheck = async () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.toBlob(
      async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        try {
          const res = await axios.post("http://127.0.0.1:5000/check_face", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          console.log("✅ Response:", res.data);
          if (res.data.success) {
            setRecognizedName(res.data.name);
          } else {
            setRecognizedName("Unknown");
          }
        } catch (error) {
          console.error("❌ Error sending image:", error);
          setRecognizedName("Error");
        }
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div className="flex flex-col items-center mt-6">
      <div style={{ position: "relative" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          width="400"
          height="300"
          style={{ borderRadius: "8px", border: "2px solid gray" }}
        />
        <canvas
          ref={canvasRef}
          width="400"
          height="300"
          willReadFrequently="true"
          style={{ position: "absolute", top: 0, left: 0 }}
        />
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={toggleCamera}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          {isCameraOn ? "Close Camera" : "Open Camera"}
        </button>

        <button
          onClick={captureAndCheck}
          disabled={!isCameraOn}
          className="bg-green-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
        >
          Check Attendance
        </button>
      </div>

      {recognizedName && (
        <h3 className="mt-4 text-lg font-semibold text-gray-700">
          Recognized: {recognizedName}
        </h3>
      )}
    </div>
  );
}

export default Attendance;
