import re
from deep_translator import GoogleTranslator

def translate_text(text, dest='zh-TW'):
    """
    Translates text to Traditional Chinese using deep-translator
    """
    try:
        translator = GoogleTranslator(target=dest)
        translation = translator.translate(text)
        return translation
    except Exception as e:
        raise Exception(f"Translation error: {str(e)}")