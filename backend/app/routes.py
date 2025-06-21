# app/routes.py

import random
from flask import Blueprint, request, jsonify
from app.services.vocabulary import load_all_vocs, download_vocs
from app.services.translation import translate_text
from app.auth import login_required
from app.models import UserProgress
import re


quiz_bp = Blueprint('quiz_bp', __name__)

# A simple in-memory cache for translations & dictionary
translations_cache = {}
dictionary = {}

def remove_symbols(s):
    return re.sub(r'^[^\w]+|[^\w]+$', '', s)

def init_vocabulary():
    """
    Called once when the Flask app is first started up.
    Ensures vocabulary data is ready.
    """
    global dictionary
    try:
        dictionary = load_all_vocs()
        if not dictionary:
            download_vocs()
            dictionary = load_all_vocs()
    except FileNotFoundError:
        download_vocs()
        dictionary = load_all_vocs()
    except Exception as e:
        # Handle or log the exception as needed
        print(f"Error during vocabulary initialization: {e}")
        raise e

@quiz_bp.route('/api/levels', methods=['GET'])
def get_levels():
    """
    Return the list of levels found in vocabularies.
    """
    if not dictionary:
        return jsonify({'error': 'Vocabulary not initialized.'}), 500
    levels = sorted(dictionary.keys())
    print(levels)
    return jsonify({'levels': levels})

@quiz_bp.route('/api/question/<level>', methods=['GET'])
def get_question(level):
    """
    Returns a random English word from the specified level
    along with multiple-choice translation options (1 correct + 3 incorrect).
    """
    # Validate level
    if level not in dictionary:
        return jsonify({'error': 'Invalid level'}), 400
    
    if len(dictionary[level]) < 4:
        return jsonify({'error': 'Not enough words in this level to generate options.'}), 400
    
    # Pick a random word
    word = remove_symbols(random.choice(dictionary[level]))

    # Translate the correct word (cached if possible)
    correct_translation = translations_cache.get(word)
    if not correct_translation:
        try:
            correct_translation = translate_text(word)
            translations_cache[word] = correct_translation
        except Exception as e:
            return jsonify({'error': f'Error translating word: {e}'}), 500
    
    # Prepare 3 random wrong translations
    wrong_words = [w for w in dictionary[level] if w != word]
    random.shuffle(wrong_words)
    wrong_words = list(map(remove_symbols, wrong_words[:3]))

    # Translate wrong words
    wrong_translations = []
    for w in wrong_words:
        tr = translations_cache.get(w)
        if not tr:
            try:
                tr = translate_text(w)
                translations_cache[w] = tr
            except Exception as e:
                return jsonify({'error': f'Error translating word: {e}'}), 500
        wrong_translations.append(tr)
    
    # Combine correct + wrong, then shuffle
    options = wrong_translations + [correct_translation]
    random.shuffle(options)
    print(options)
    
    return jsonify({
        'word': word,
        'options': options
    })

@quiz_bp.route('/api/check-answer', methods=['POST'])
def check_answer():
    """
    Body should be JSON with: { "word": "...", "selected": "..." }
    We check if 'selected' is the correct translation for 'word'.
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request must be in JSON format.'}), 400
    
    word = data.get('word')
    selected = data.get('selected')
    level = data.get('level')  # Add level for progress tracking
    
    if not word or not selected:
        return jsonify({'error': 'Both "word" and "selected" fields are required.'}), 400
    
    if not isinstance(word, str) or not isinstance(selected, str):
        return jsonify({'error': '"word" and "selected" must be strings.'}), 400
    
    # Verify that the word exists in the dictionary
    if not any(word in words for words in dictionary.values()):
        return jsonify({'error': 'Word not found in vocabulary.'}), 400
    
    correct_translation = translations_cache.get(word)
    if not correct_translation:
        try:
            correct_translation = translate_text(word)
            translations_cache[word] = correct_translation
        except Exception as e:
            return jsonify({'error': f'Error translating word: {e}'}), 500
    
    correct = (selected.strip().lower() == correct_translation.strip().lower())
    
    # Track user progress if authenticated
    session_token = request.headers.get('Authorization')
    if session_token and session_token.startswith('Bearer '):
        session_token = session_token[7:]
        from app.models import Session
        session_data = Session.validate_session(session_token)
        if session_data and level:
            UserProgress.record_answer(session_data['user_id'], level, word, correct)
    
    return jsonify({
        'correct': correct,
        'correctTranslation': correct_translation
    })

@quiz_bp.route('/api/user/stats', methods=['GET'])
@login_required
def get_user_stats():
    """Get user's learning statistics"""
    user_id = request.current_user['user_id']
    stats = UserProgress.get_user_stats(user_id)
    return jsonify(stats)
