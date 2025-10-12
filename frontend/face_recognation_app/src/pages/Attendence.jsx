import React, { useRef, useState, useEffect } from "react";
import axios from "axios"
function Attendence() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [opencvReady, setOpencvReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);


  // ✅ Wait for OpenCV to load
  useEffect(() => {
    const check = setInterval(() => {
      if (window.cv && window.cv.FS_createDataFile) {
        clearInterval(check);
        setOpencvReady(true);
        console.log("✅ OpenCV.js is ready");
      }
    }, 100);
  }, []);

  // ✅ Open or close camera
  const toggleCamera = async () => {
    if (!isCameraOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOn(true);
      } catch (error) {
        console.error("Camera Error:", error);
      }
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
      setIsCameraOn(false);
    }
  };

  // ✅ Face detection
  useEffect(() => {
    if (!isCameraOn || !opencvReady) return;

    const cv = window.cv;
    const faceCascade = new cv.CascadeClassifier();

    const loadCascade = async () => {
      const file = "haarcascade_frontalface_default.xml";
      const response = await fetch(file);
      const data = await response.arrayBuffer();
      const bytes = new Uint8Array(data);
      cv.FS_createDataFile("/", file, bytes, true, false, false);
      faceCascade.load(file);
      console.log("✅ Haar cascade loaded");
      detectFace();
    };

    const detectFace = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const process = () => {
        if (!isCameraOn) return;

        const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        const gray = new cv.Mat();

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        let img = cv.imread(canvas);
        cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY, 0);

        const faces = new cv.RectVector();
        faceCascade.detectMultiScale(gray, faces, 1.1, 6, 0);

        for (let i = 0; i < faces.size(); i++) {
          const face = faces.get(i);
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "lime";
          ctx.rect(face.x, face.y, face.width, face.height);
          ctx.stroke();
        }

        src.delete();
        gray.delete();
        faces.delete();
        img.delete();

        requestAnimationFrame(process);
      };

      process();
    };

    loadCascade();
  }, [isCameraOn, opencvReady]);

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
          style={{
            position: "absolute",
            top: 0,
            left: 0,
          }}
        />
      </div>

      <button
        onClick={toggleCamera}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md"
      >
        {isCameraOn ? "Close Camera" : "Open Camera"}
      </button>
    </div>
  );
}

export default Attendence;
