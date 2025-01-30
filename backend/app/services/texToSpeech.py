# backend/app/services/text_to_speech.py

import pyttsx3

def read_word(text):
    """
    Converts the text to speech (using pyttsx3) and saves or streams the output.
    """
    engine = pyttsx3.init()
    engine.setProperty('rate', 150)
    engine.setProperty('volume', 0.9)
    
    engine.say(text)
    engine.runAndWait()
