# backend/app/services/vocabulary.py

import os
import requests
from collections import defaultdict
from PyPDF2 import PdfReader
from ..models import SystemVocabulary, Database

PDF_URL = "https://www.ceec.edu.tw/SourceUse/ce37/5.pdf"
PDF_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'temp', 'vocs.pdf')

def create_pdf():
    """
    Download the PDF from a remote URL and save it locally.
    Returns True if successful, False otherwise.
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(os.path.dirname(PDF_PATH), exist_ok=True)
        
        response = requests.get(PDF_URL, timeout=30)
        response.raise_for_status()  # Raise exception for bad status codes
        
        with open(PDF_PATH, "wb") as file:
            file.write(response.content)
            
        # Verify file was written and has content
        if os.path.exists(PDF_PATH) and os.path.getsize(PDF_PATH) > 0:
            return True
        return False
    except Exception as e:
        print(f"Error downloading PDF: {e}")
        return False

def extract_vocabulary_from_pdf(pdf_path=PDF_PATH):
    """
    Extract vocabulary from the PDF and save it directly to the database.
    Returns True if successful, False otherwise.
    """
    try:
        # Create temp directory if it doesn't exist
        os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
        
        word_level_pairs = []
        
        # Ensure the PDF exists and has content
        if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
            success = create_pdf()
            if not success:
                print("Failed to download or create PDF")
                return False
            
            # Double check after download
            if not os.path.exists(pdf_path) or os.path.getsize(pdf_path) == 0:
                print("PDF file still doesn't exist or is empty after download attempt")
                return False
        
        with open(pdf_path, 'rb') as file:
            reader = PdfReader(file)
            if not reader.pages or len(reader.pages) < 2:
                print("PDF has insufficient pages")
                return False
                
            for page in reader.pages[1:]:
                texts = page.extract_text().split('\n')
                texts = list(map(lambda x: x.strip(), texts))
                
                if not texts:
                    continue
                    
                level = texts[0].replace(' ', '')
                
                # Extract vocabulary lines
                vocs = [
                    ''.join([i for i in x.split(' ')[0] if not i.isdigit()])
                    for x in texts[1:]
                ]
                vocs = [i for i in vocs if 'LEVEL' not in i and i != '']
                
                for voc in vocs:
                    word_level_pairs.append((voc, level))
        
        if not word_level_pairs:
            print("No vocabulary words were extracted from the PDF")
            return False
            
        # Save all words to the database at once
        success = SystemVocabulary.add_multiple_words(word_level_pairs)
        return success
        
    except Exception as e:
        print(f"Error extracting vocabulary from PDF: {e}")
        return False

def download_vocs():
    """
    Orchestrates the download of the PDF and extraction of vocabularies into the database.
    """
    create_pdf()
    return extract_vocabulary_from_pdf()

def load_all_vocs():
    """
    Read vocabularies from the database into a dictionary:
        dictionary[level] -> list of words
    """
    # First check if any vocabulary exists in the database
    conn = Database.get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) as count FROM system_vocabulary')
    count = cursor.fetchone()['count']
    conn.close()
    
    # If database is empty, try to load from PDF
    if count == 0:
        # Make sure the database is initialized
        Database.init_db()
        download_vocs()
    
    # Return all words from database
    return SystemVocabulary.get_all_words()
