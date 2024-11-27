import tkinter as tk
import subprocess
import sys
import importlib.util
import os
from collections import defaultdict
import random
import warnings
import threading
from tkinter import messagebox

from googletrans import Translator

global dictionary

def translate_text(text, dest='zh-tw'):
    translator = Translator()
    translation = translator.translate(text, dest=dest)
    return translation.text

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
    pass
    if importlib.util.find_spec(package) is None:
        install(package)

import requests
from PyPDF2 import PdfReader
warnings.filterwarnings("ignore")


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
class TranslationTestApp:
    def __init__(self, master):
        self.master = master
        self.master.title("English to Chinese Translation Test")
        self.master.geometry("800x600")  # Increased window size for longer height
        self.master.resizable(True, True)  # Allow window to be resizable
        
        # Initialize variables
        self.selected_level = tk.StringVar()
        self.score = 0
        self.total = 0
        self.current_word = ""
        self.current_translation = ""
        self.options = []
        self.translations = {}  # Cache for translations
        
        # Create Level Selection Screen
        self.create_level_selection_screen()
    
    def create_level_selection_screen(self):
        # Clear the window
        for widget in self.master.winfo_children():
            widget.destroy()
        
        # Title
        title = tk.Label(self.master, text="Select a Level", font=("Helvetica", 24))
        title.pack(pady=30, anchor='center')
        
        # Frame to hold level buttons
        button_frame = tk.Frame(self.master)
        button_frame.pack(pady=20, fill='both', expand=True)
        
        # Arrange buttons in a grid with 2 columns
        columns = 2
        for idx, level in enumerate(sorted(dictionary.keys())):
            btn = tk.Button(
                button_frame,
                text=level,
                width=20,
                height=3,
                font=("Helvetica", 14),
                command=lambda lvl=level: self.start_quiz(lvl)
            )
            row = idx // columns
            col = idx % columns
            btn.grid(row=row, column=col, padx=20, pady=20, sticky='nsew')
        
        # Configure grid weights to make buttons expand
        for col in range(columns):
            button_frame.grid_columnconfigure(col, weight=1)
        for row in range((len(dictionary) + columns - 1) // columns):
            button_frame.grid_rowconfigure(row, weight=1)
    
    def start_quiz(self, level):
        self.selected_level.set(level)
        self.score = 0
        self.total = 0
        self.translations = {}
        
        # Proceed to quiz screen
        self.create_quiz_screen()
        self.next_question()
    
    def create_quiz_screen(self):
        # Clear the window
        for widget in self.master.winfo_children():
            widget.destroy()
        
        # Frame for Score
        score_frame = tk.Frame(self.master)
        score_frame.pack(pady=10)
        
        self.score_label = tk.Label(
            score_frame, text=f"Score: {self.score} / {self.total}", font=("Helvetica", 16)
        )
        self.score_label.pack()
        
        # Word Label
        self.word_label = tk.Label(
            self.master, text="", font=("Helvetica", 20)
        )
        self.word_label.pack(pady=40)
        
        # Frame for Options
        options_frame = tk.Frame(self.master)
        options_frame.pack(pady=20)
        
        self.option_buttons = []
        for i in range(4):
            btn = tk.Button(
                options_frame,
                text=f"Option {i+1}",
                width=30,
                height=2,
                font=("Helvetica", 14),
                command=lambda idx=i: self.check_answer(idx)
            )
            btn.grid(row=i//2, column=i%2, padx=20, pady=20, sticky='nsew')
            self.option_buttons.append(btn)
        
        # Configure grid weights for options_frame
        for col in range(2):
            options_frame.grid_columnconfigure(col, weight=1)
        for row in range(2):
            options_frame.grid_rowconfigure(row, weight=1)
        
        # Exit Button
        exit_btn = tk.Button(
            self.master,
            text="Exit",
            width=10,
            font=("Helvetica", 12),
            command=self.master.quit
        )
        exit_btn.pack(pady=20)
    
    def next_question(self):
        words = list(dictionary[self.selected_level.get()])
        self.current_word = random.choice(words)
        
        # Start a thread to translate the current word
        threading.Thread(target=self.prepare_question, args=(self.current_word,), daemon=True).start()
    
    def prepare_question(self, word):
        # Check if the word is already translated
        if word in self.translations:
            translated = self.translations[word]
        else:
            # Translate the word
            translated = translate_text(word)
            self.translations[word] = translated
        
        self.current_translation = translated
        
        # Prepare options
        wrong_translations = self.get_wrong_options(word)
        self.options = wrong_translations + [self.current_translation]
        random.shuffle(self.options)
        
        # Update GUI in the main thread
        self.master.after(0, self.display_question)
    
    def display_question(self):
        # Update the word label
        self.word_label.config(text=f"{self.current_word}")
        
        # Update option buttons
        for idx, option in enumerate(self.options):
            self.option_buttons[idx].config(text=option, bg="SystemButtonFace", state=tk.NORMAL)
        
        # Update score label
        self.score_label.config(text=f"Score: {self.score} / {self.total}")
    
    def get_wrong_options(self, correct_word):
        """
        Selects three unique wrong options by choosing three different words from the current level,
        translates them, and returns their translations.
        """
        level = self.selected_level.get()
        words = list(dictionary[level])

        # Exclude the current word
        wrong_words = [word for word in words if word != correct_word]

        # If there are fewer than 3 words in the level, adjust accordingly
        num_options = min(3, len(wrong_words))

        # Randomly select three unique wrong words
        selected_wrong_words = random.sample(wrong_words, num_options)

        # Translate the wrong words, using cache if available
        wrong_translations = []
        for word in selected_wrong_words:
            if word in self.translations:
                translated = self.translations[word]
            else:
                translated = translate_text(word)
                self.translations[word] = translated
            wrong_translations.append(translated)
        
        # If fewer than 3 wrong options are available, fill the remaining with placeholders
        while len(wrong_translations) < 3:
            wrong_translations.append("N/A")  # Placeholder or consider alternative handling
        
        return wrong_translations[:3]
    
    def check_answer(self, selected_idx):
        selected_option = self.options[selected_idx]
        self.total += 1
        
        # Disable buttons to prevent multiple clicks
        for btn in self.option_buttons:
            btn.config(state=tk.DISABLED)
        
        if selected_option == self.current_translation:
            self.score += 1
            self.option_buttons[selected_idx].config(bg="green")
            messagebox.showinfo("Correct!", "Good job! That's correct.")
        else:
            self.option_buttons[selected_idx].config(bg="red")
            # Highlight the correct answer
            try:
                correct_idx = self.options.index(self.current_translation)
                self.option_buttons[correct_idx].config(bg="green")
            except ValueError:
                pass  # In case the correct translation wasn't among options
            messagebox.showinfo("Incorrect", f"Sorry, the correct translation is:\n{self.current_translation}")
        
        # Update score label
        self.score_label.config(text=f"Score: {self.score} / {self.total}")
        
        # Proceed to next question after a short delay
        self.master.after(1000, self.next_question)
    
    def run(self):
        self.master.mainloop()
        
if __name__ == "__main__":
    if not os.path.exists('vocabularies.txt') or os.path.getsize('vocabularies.txt') == 0:
        downloadVocs()
    dictionary = loadAllVocs()

    root = tk.Tk()
    app = TranslationTestApp(root)
    app.run()
    
