# backend/app/services/vocabulary.py

import os
import requests
from collections import defaultdict
from PyPDF2 import PdfReader

PDF_URL = "https://www.ceec.edu.tw/SourceUse/ce37/5.pdf"
PDF_PATH = "vocs.pdf"
VOCAB_TXT_PATH = "vocabularies.txt"

def create_pdf():
    """
    Download the PDF from a remote URL and save it locally.
    """
    response = requests.get(PDF_URL)
    with open(PDF_PATH, "wb") as file:
        file.write(response.content)

def load_txt_from_pdf(pdf_path=PDF_PATH, txt_path=VOCAB_TXT_PATH):
    """
    Extract vocabulary from the PDF and save it in a .txt file.
    """
    with open(pdf_path, 'rb') as file:
        reader = PdfReader(file)
        with open(txt_path, 'w', encoding='utf-8') as txt:
            for page in reader.pages[1:]:
                texts = page.extract_text().split('\n')
                texts = list(map(lambda x: x.strip(), texts))
                level = texts[0].replace(' ', '')
                
                # Extract vocabulary lines
                vocs = [
                    ''.join([i for i in x.split(' ')[0] if not i.isdigit()])
                    for x in texts[1:]
                ]
                vocs = [i for i in vocs if 'LEVEL' not in i and i != '']
                
                for voc in vocs:
                    txt.write(f'{voc} {level}\n')

def download_vocs():
    """
    Orchestrates the download of the PDF and extraction of vocabularies.
    """
    create_pdf()
    load_txt_from_pdf()

def load_all_vocs(txt_path=VOCAB_TXT_PATH):
    """
    Read vocabularies.txt into a dictionary:
        dictionary[level] -> list of words
    """
    dictionary = defaultdict(list)
    with open(txt_path, 'r', encoding='utf-8') as lines:
        for line in lines:
            line = line.strip()
            if not line:
                continue
            word, level = line.split(' ')
            dictionary[level].append(word)
    return dictionary
