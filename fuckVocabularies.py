import tkinter
import subprocess
import sys
import importlib.util
import os
from collections import defaultdict
import random
import warnings
def createPDF():
    # Specify the URL of the PDF
    url = "https://www.ceec.edu.tw/SourceUse/ce37/5.pdf"

    # Send a GET request to the URL
    response = requests.get(url)

    # Save the PDF locally
    with open("vocs.pdf", "wb") as file:
         file.write(response.content)
    print("PDF downloaded successfully!")
    
def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])
packages = ["PyPDF2", "requests", "deep-translator"]

for package in packages:
    if importlib.util.find_spec(package) is None:
        install(package)

import requests
from PyPDF2 import PdfReader
warnings.filterwarnings("ignore")

from deep_translator import GoogleTranslator

def loadTXT(path = 'vocs.pdf'):
    with open(path, 'rb') as file:
        reader = PdfReader(file)
        with open ('vocabularies.txt', 'w', encoding='utf-8') as txt:
            # Loop through all the pages and extract text
            for page in reader.pages[1:]:
                texts = page.extract_text().split('\n')
                texts = list(map(lambda x: x.strip(), texts))
                level = texts[0].replace(' ','')
                
                vocs = list(map(lambda x: ''.join([i for i in x.split(' ')[0] if not i.isdigit()]), texts[1:]))
                vocs = [i for i in vocs if 'LEVEL' not in i and i != '']
                for voc in vocs:
                    txt.write(f'{voc} {level}\n')
                    
    print('vocabulary file download!')

def downloadVocs():
    createPDF()
    loadTXT()

def loadAllVocs():
    dictionary = defaultdict(list)
    with open ('vocabularies.txt', 'r', encoding='utf-8') as lines:
        for line in lines:
            line = line.rstrip('\n').split(' ')  # Remove newline characters
            dictionary[line[1]].append(line[0])
    return dictionary

if __name__ == "__main__":
    if not os.path.exists('vocabularies.txt') or os.path.getsize('vocabularies.txt') == 0:
        downloadVocs()
    dictionary = loadAllVocs()

    voc = random.choice(dictionary['LEVEL1'])
    def translate_to_chinese(text):
        translated = GoogleTranslator(source='auto', target='zh').translate(text)
        return translated

    print(translate_to_chinese(voc))
    
