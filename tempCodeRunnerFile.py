def translate_text(text, dest='zh-tw'):
    translator = Translator()
    translation = translator.translate(text, dest=dest)
    return translation.text