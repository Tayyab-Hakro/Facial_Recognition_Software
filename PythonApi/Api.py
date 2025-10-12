import cv2
import os
import face_recognition
import csv
from datetime import datetime
from flask import Flask, request, jsonify

app = Flask(__name__)

UPLOAD_FOLDER = "received_images"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/save_images", methods=["POST"])
def save_images():
    try:
        name = request.form.get("name")
        images = request.files.getlist("images")

        if not name or not images:
            return jsonify({"success": False, "message": "Missing name or images"}), 400

        print(f"📥 Received data for: {name}")
        print(f"📸 Total images: {len(images)}")

        # Save received images
        person_folder = os.path.join(UPLOAD_FOLDER, name)
        os.makedirs(person_folder, exist_ok=True)

        for image in images:
            image_path = os.path.join(person_folder, image.filename)
            image.save(image_path)

        return jsonify({"success": True, "message": "Images saved successfully."})

    except Exception as e:
        print("❌ Error:", e)
        return jsonify({"success": False, "message": str(e)}), 500


# ✅ Load Haar Cascade model
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

# ✅ Dataset path (contains multiple folders: Faheem, Tayyab, etc.)
dataset_path = r"C:\Users\tayyab\Desktop\Attendence_System\PythonApi\Dataset"
resized_dataset_path = "resized_dataset"
attendance_file = "attendance.csv"

# ✅ Ensure attendance file exists
if not os.path.exists(attendance_file):
    with open(attendance_file, "w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["Name", "Date"])

# ✅ Step 1: Resize all images to 128x128
os.makedirs(resized_dataset_path, exist_ok=True)

for person_name in os.listdir(dataset_path):
    person_folder = os.path.join(dataset_path, person_name)
    if os.path.isdir(person_folder):
        print(f"📂 Processing folder: {person_name}")
        output_folder = os.path.join(resized_dataset_path, person_name)
        os.makedirs(output_folder, exist_ok=True)

        for folder_image in os.listdir(person_folder):
            image_path = os.path.join(person_folder, folder_image)
            img = cv2.imread(image_path)
            if img is None:
                continue

            resized = cv2.resize(img, (128, 128))
            cv2.imwrite(os.path.join(output_folder, folder_image), resized)

        print(f"✅ All images for {person_name} resized successfully!\n")

# ✅ Step 2: Encode known faces
known_Encoded = []
known_names = []

for person_name in os.listdir(resized_dataset_path):
    person_folder = os.path.join(resized_dataset_path, person_name)
    if os.path.isdir(person_folder):
        for image_name in os.listdir(person_folder):
            image_path = os.path.join(person_folder, image_name)
            image = face_recognition.load_image_file(image_path)
            encodings = face_recognition.face_encodings(image)
            if len(encodings) > 0:
                known_Encoded.append(encodings[0])
                known_names.append(person_name)

print(f"✅ Encoded {len(known_names)} known faces successfully.\n")

# ✅ Step 3: Attendance setup
recognized_today = set()

def mark_attendance(name):
    """Save attendance record if not already marked"""
    today = datetime.now().strftime("%Y-%m-%d")
    if name not in recognized_today:
        with open(attendance_file, mode="a", newline="") as file:
            writer = csv.writer(file)
            writer.writerow([name, today])
            recognized_today.add(name)
            print("🟩 Attendance marked for:", name)


# ✅ Step 4: Webcam function
def start_camera():
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("❌ Cannot open webcam")
        return {"success": False, "message": "Cannot open webcam"}

    print("📸 Webcam started. Press 'q' to quit.\n")

    while True:
        ret, frame = cam.read()
        if not ret:
            print("❌ Failed to grab frame")
            break

        # Convert frame from BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Detect and encode faces
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            matches = face_recognition.compare_faces(known_Encoded, face_encoding, tolerance=0.5)
            name = "Unknown"

            if True in matches:
                first_match_index = matches.index(True)
                name = known_names[first_match_index]
                mark_attendance(name)

            # Draw rectangle and name
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)
            cv2.putText(frame, name, (left + 6, top - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        cv2.imshow("Webcam - Face Recognition Attendance", frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cam.release()
    cv2.destroyAllWindows()
    print("🟨 Webcam closed.")
    return {"success": True, "message": "Webcam closed successfully"}


# ✅ Add a Flask route to start webcam via URL
@app.route("/start_camera", methods=["GET"])
def start_camera_route():
    try:
        result = start_camera()
        return jsonify(result)
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


# ✅ Run Flask server
if __name__ == "__main__":
    app.run(port=5000, debug=True)
