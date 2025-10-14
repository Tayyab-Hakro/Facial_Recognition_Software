import os
import cv2
import face_recognition
import csv
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Allow React frontend to connect

app = Flask(__name__)
CORS(app)  # ✅ Enable CORS

# === Paths and folders ===
DATASET_FOLDER = "./Dataset"
RESIZED_DATASET = "./resized_dataset"
ATTENDANCE_FILE = "attendance.csv"

os.makedirs(DATASET_FOLDER, exist_ok=True)
os.makedirs(RESIZED_DATASET, exist_ok=True)

# === Ensure attendance file exists ===
if not os.path.exists(ATTENDANCE_FILE):
    with open(ATTENDANCE_FILE, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Date"])

# === Resize dataset images for faster processing ===
for person_name in os.listdir(DATASET_FOLDER):
    person_folder = os.path.join(DATASET_FOLDER, person_name)
    if os.path.isdir(person_folder):
        resized_folder = os.path.join(RESIZED_DATASET, person_name)
        os.makedirs(resized_folder, exist_ok=True)

        for img_name in os.listdir(person_folder):
            img_path = os.path.join(person_folder, img_name)
            img = cv2.imread(img_path)
            if img is None:
                continue
            resized = cv2.resize(img, (128, 128))
            cv2.imwrite(os.path.join(resized_folder, img_name), resized)

# === Encode known faces ===
known_encodings = []
known_names = []

for person_name in os.listdir(RESIZED_DATASET):
    person_folder = os.path.join(RESIZED_DATASET, person_name)
    if os.path.isdir(person_folder):
        for image_name in os.listdir(person_folder):
            image_path = os.path.join(person_folder, image_name)
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                known_encodings.append(encodings[0])
                known_names.append(person_name)

print(f"✅ Encoded {len(known_names)} known faces successfully.\n")

# === Attendance tracking ===
recognized_today = set()

def mark_attendance(name):
    today = datetime.now().strftime("%Y-%m-%d")
    if name not in recognized_today:
        with open(ATTENDANCE_FILE, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([name, today])
        recognized_today.add(name)
        print(f"🟩 Attendance marked for: {name}")

# === API endpoint: check face ===
@app.route("/check_face", methods=["POST"])
def check_face():
    try:
        if "image" not in request.files:
            return jsonify({"success": False, "name": "No image received"})

        file = request.files["image"]
        image_path = "temp.jpg"
        file.save(image_path)

        unknown_image = face_recognition.load_image_file(image_path)
        unknown_encodings = face_recognition.face_encodings(unknown_image)

        if len(unknown_encodings) == 0:
            print("⚠️ No face detected in frame.")
            return jsonify({"success": False, "name": "No face detected"})

        unknown_encoding = unknown_encodings[0]
        matches = face_recognition.compare_faces(known_encodings, unknown_encoding, tolerance=0.5)
        name = "Unknown"

        if True in matches:
            index = matches.index(True)
            name = known_names[index]
            mark_attendance(name)
            print(f"✅ Recognized: {name}")
            return jsonify({"success": True, "name": name})
        else:
            print("❌ Face not recognized, returning 'Unknown'.")
            return jsonify({"success": False, "name": "Unknown"})

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"success": False, "name": "Error", "message": str(e)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
