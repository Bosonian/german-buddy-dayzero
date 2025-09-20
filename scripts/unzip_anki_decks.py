
import os
import zipfile

ANKI_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'germandb'))
EXTRACT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'germandb', 'extracted'))

def main():
    for file in os.listdir(ANKI_DIR):
        if file.endswith(".apkg"):
            try:
                with zipfile.ZipFile(os.path.join(ANKI_DIR, file), 'r') as zip_ref:
                    zip_ref.extractall(os.path.join(EXTRACT_DIR, file.replace(".apkg", "")))
            except Exception as e:
                print(f"Error processing {file}: {e}")

if __name__ == "__main__":
    main()
