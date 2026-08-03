import cv2
import numpy as np

def preprocess_frame(image_path, output_path):
    # 1. Read the image
    img = cv2.imread(image_path)
    
    if img is None:
        print("Error: Image not found.")
        return

    # 2. Resize to 640x640 to fit YOLOv8 requirements
    img_resized = cv2.resize(img, (640, 640))
    
    # 3. Apply Gaussian Blur to anonymize PII (faces/license plates)
    # (In practice, you can detect faces and blur only those specific regions)
    img_blurred = cv2.GaussianBlur(img_resized, (25, 25), 0)
    
    # 4. Save the preprocessed image
    cv2.imwrite(output_path, img_blurred)
    print(f"Success: Preprocessed image saved to {output_path}")

if __name__ == "__main__":
    print("Preprocessing script initialized.")
    # preprocess_frame("sample_input.jpg", "sample_output.jpg")