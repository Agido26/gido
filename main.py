from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS
import os
import PyPDF2
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Serve static files (your HTML, CSS, JS)
@app.route('/')
def serve_html():
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# Handle PDF processing
@app.route('/process-pdf', methods=['POST'])
def process_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        pdf_file = request.files['file']
        if pdf_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read PDF content
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file.read()))
        text_content = {}

        # Extract text from each page
        for page_num in range(len(pdf_reader.pages)):
            page = pdf_reader.pages[page_num]
            text_content[page_num + 1] = page.extract_text()

        return jsonify({
            'filename': pdf_file.filename,
            'pageCount': len(pdf_reader.pages),
            'content': text_content
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)