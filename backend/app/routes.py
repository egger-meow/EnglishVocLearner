# app/routes.py

import random
from flask import Blueprint, request, jsonify
from app.services.vocabulary import load_all_vocs, download_vocs
from app.models import SystemVocabulary, Database
from app.services.translation import translate_text
from app.auth import login_required
from app.models import UserProgress, VocabularyLibrary
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
    Ensures vocabulary data is ready in the database.
    """
    global dictionary
    try:
        # Initialize the database tables if needed
        Database.init_db()
        
        # Load vocabulary data from the database
        dictionary = load_all_vocs()
        
        # If dictionary is empty, try to download and process vocabulary
        if not dictionary:
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
    # Get all vocabulary words grouped by level from the database
    vocab_dict = SystemVocabulary.get_all_words()
    
    if not vocab_dict:
        return jsonify({'error': 'Vocabulary not initialized.'}), 500
        
    levels = sorted(vocab_dict.keys())
    print(levels)
    return jsonify({'levels': levels})

@quiz_bp.route('/api/question/<level>', methods=['GET'])
def get_question(level):
    """
    Returns a random English word from the specified level
    along with multiple-choice translation options (1 correct + 3 incorrect).
    """
    # Get level words from the database
    words_in_level = SystemVocabulary.get_words_by_level(level)
    
    # Validate level
    if not words_in_level:
        # Fallback to dictionary if needed for backward compatibility
        if level not in dictionary:
            return jsonify({'error': 'Invalid level'}), 400
        words_in_level = dictionary[level]
    
    if len(words_in_level) < 4:
        return jsonify({'error': 'Not enough words in this level to generate options.'}), 400
    
    # Pick a random word
    word = remove_symbols(random.choice(words_in_level))

    # Translate the correct word (cached if possible)
    correct_translation = translations_cache.get(word)
    if not correct_translation:
        try:
            correct_translation = translate_text(word)
            translations_cache[word] = correct_translation
        except Exception as e:
            return jsonify({'error': f'Error translating word: {e}'}), 500
    
    # Prepare 3 random wrong translations
    wrong_words = [w for w in words_in_level if w != word]
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

@quiz_bp.route('/api/vocabulary-question', methods=['GET'])
@login_required
def get_vocabulary_question():
    """
    Returns a random English word from the user's vocabulary library
    along with multiple-choice translation options (1 correct + 3 incorrect).
    """
    user_id = request.current_user['user_id']
    
    conn = Database.get_connection()
    cursor = conn.cursor()
    
    try:
        # Get all words from user's vocabulary library
        cursor.execute('SELECT word, translation FROM vocabulary_library WHERE user_id = ?', (user_id,))
        user_words = cursor.fetchall()
        
        if len(user_words) < 4:
            return jsonify({'error': 'You need at least 4 words in your vocabulary library to start a quiz.'}), 400
        
        # Pick a random word
        selected_word = random.choice(user_words)
        word = remove_symbols(selected_word['word'])
        correct_translation = selected_word['translation']
        
        # Get 3 random wrong translations from other words in user's library
        other_words = [w for w in user_words if w['word'] != selected_word['word']]
        random.shuffle(other_words)
        wrong_translations = [w['translation'] for w in other_words[:3]]
        
        # If user doesn't have enough words, supplement with system vocabulary translations
        if len(wrong_translations) < 3:
            # Get additional wrong answers from system vocabulary
            cursor.execute('SELECT word FROM system_vocabulary ORDER BY RANDOM() LIMIT ?', (3 - len(wrong_translations),))
            system_words = cursor.fetchall()
            
            for sys_word in system_words:
                sys_word_clean = remove_symbols(sys_word['word'])
                if sys_word_clean != word:
                    # Get translation for system word
                    tr = translations_cache.get(sys_word_clean)
                    if not tr:
                        try:
                            tr = translate_text(sys_word_clean)
                            translations_cache[sys_word_clean] = tr
                        except Exception as e:
                            continue
                    if tr not in wrong_translations and tr != correct_translation:
                        wrong_translations.append(tr)
                        if len(wrong_translations) >= 3:
                            break
        
        # Ensure we have exactly 3 wrong translations
        wrong_translations = wrong_translations[:3]
        
        # Combine correct + wrong, then shuffle
        options = wrong_translations + [correct_translation]
        random.shuffle(options)
        
        return jsonify({
            'word': word,
            'options': options
        })
        
    except Exception as e:
        print(f"Error generating vocabulary question: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        conn.close()

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

@quiz_bp.route('/api/user/mistakes', methods=['GET'])
@login_required
def get_user_mistakes():
    """Get user's mistake records"""
    user_id = request.current_user['user_id']
    level = request.args.get('level', 'all')
    mistakes = UserProgress.get_user_mistakes(user_id, level)
    return jsonify(mistakes)

@quiz_bp.route('/api/vocabulary', methods=['GET'])
@login_required
def get_vocabulary():
    """Get user's vocabulary library"""
    try:
        print(f"[DEBUG] get_vocabulary called")
        print(f"[DEBUG] request.current_user: {request.current_user}")
        
        user_id = request.current_user['user_id']
        search_term = request.args.get('search', '')
        level = request.args.get('level', 'all')
        
        print(f"[DEBUG] user_id: {user_id}, search_term: '{search_term}', level: '{level}'")
        
        vocabulary = VocabularyLibrary.get_user_vocabulary(user_id, search_term, level)
        print(f"[DEBUG] vocabulary result: {vocabulary}")
        
        return jsonify(vocabulary)
    except Exception as e:
        print(f"[ERROR] get_vocabulary failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to fetch vocabulary: {str(e)}'}), 500

@quiz_bp.route('/api/vocabulary/suggestions', methods=['GET'])
@login_required
def get_vocabulary_suggestions():
    """Get search suggestions for vocabulary words"""
    user_id = request.current_user['user_id']
    search_query = request.args.get('search', '').strip()
    level = request.args.get('level', 'all')
    
    if not search_query or len(search_query) < 2:
        return jsonify({'suggestions': []})
    
    # Get suggestions from user's vocabulary library
    conn = Database.get_connection()
    cursor = conn.cursor()
    
    try:
        # Build the SQL query based on the level filter
        query = '''
            SELECT word, level 
            FROM vocabulary_library 
            WHERE user_id = ? AND (word LIKE ? OR translation LIKE ? OR notes LIKE ?)
        '''
        
        params = [user_id, f"%{search_query}%", f"%{search_query}%", f"%{search_query}%"]
        
        # Add level filter if not 'all'
        if level != 'all':
            query += ' AND level = ?'
            params.append(level)
        
        # Limit results and order by relevance (exact matches first)
        query += '''
            ORDER BY 
                CASE 
                    WHEN word = ? THEN 0
                    WHEN word LIKE ? THEN 1
                    WHEN translation = ? THEN 2
                    WHEN translation LIKE ? THEN 3
                    WHEN notes LIKE ? THEN 4
                    ELSE 5
                END, 
                word ASC
            LIMIT 10
        '''
        
        params.extend([search_query, f"{search_query}%", search_query, f"{search_query}%", f"%{search_query}%"])
        
        # Execute the query
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        suggestions = [{'word': row['word'], 'level': row['level']} for row in results]
        
        return jsonify({'suggestions': suggestions})
        
    except Exception as e:
        print(f"Error fetching vocabulary suggestions: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        conn.close()

@quiz_bp.route('/api/vocabulary/search', methods=['GET'])
@login_required
def search_system_vocabulary():
    """Search the system vocabulary database and return results that can be added to personal vocabulary"""
    user_id = request.current_user['user_id']
    search_query = request.args.get('search', '').strip()
    level = request.args.get('level', 'all')
    
    if not search_query or len(search_query) < 2:
        return jsonify({'results': []})
    
    conn = Database.get_connection()
    cursor = conn.cursor()
    
    try:
        # Search system vocabulary
        query = '''
            SELECT sv.word, sv.level
            FROM system_vocabulary sv
            LEFT JOIN vocabulary_library vl ON sv.word = vl.word AND vl.user_id = ?
            WHERE sv.word LIKE ? AND vl.word IS NULL
        '''
        
        params = [user_id, f"%{search_query}%"]
        
        # Add level filter if not 'all'
        if level != 'all':
            query += ' AND sv.level = ?'
            params.append(level)
        
        # Order by relevance and limit results
        query += '''
            ORDER BY 
                CASE 
                    WHEN sv.word = ? THEN 0
                    WHEN sv.word LIKE ? THEN 1
                    ELSE 2
                END, 
                sv.word ASC
            LIMIT 20
        '''
        
        params.extend([search_query, f"{search_query}%"])
        
        # Execute the query
        cursor.execute(query, params)
        results = cursor.fetchall()
        
        # Get translations for the results
        search_results = []
        for row in results:
            word = row['word']
            level = row['level']
            
            # Get translation from cache or translate
            translation = translations_cache.get(word)
            if not translation:
                try:
                    translation = translate_text(word)
                    translations_cache[word] = translation
                except Exception as e:
                    print(f"Error translating word {word}: {e}")
                    translation = ""
            
            search_results.append({
                'word': word,
                'level': level,
                'translation': translation,
                'in_library': False  # These are words not yet in user's library
            })
        
        return jsonify({'results': search_results})
        
    except Exception as e:
        print(f"Error searching system vocabulary: {e}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        conn.close()

@quiz_bp.route('/api/vocabulary', methods=['POST'])
@login_required
def add_vocabulary():
    """Add a word to user's vocabulary library"""
    user_id = request.current_user['user_id']
    data = request.get_json()
    
    if not data or 'word' not in data:
        return jsonify({'error': '請提供單字資料'}), 400
    
    word = data.get('word')
    translation = data.get('translation')
    level = data.get('level')
    notes = data.get('notes')
    added_from = data.get('added_from', 'manual')
    
    success = VocabularyLibrary.add_word(
        user_id=user_id,
        word=word,
        translation=translation,
        level=level,
        notes=notes,
        added_from=added_from
    )
    
    if success:
        return jsonify({'message': '單字已成功新增至您的單字庫'})
    else:
        return jsonify({'error': '新增單字失敗'}), 500

@quiz_bp.route('/api/vocabulary/<word>', methods=['DELETE'])
@login_required
def remove_vocabulary(word):
    """Remove a word from user's vocabulary library"""
    user_id = request.current_user['user_id']
    
    success = VocabularyLibrary.remove_word(user_id, word)
    
    if success:
        return jsonify({'message': '單字已從單字庫中移除'})
    else:
        return jsonify({'error': '移除單字失敗'}), 404

@quiz_bp.route('/api/vocabulary/<word>/notes', methods=['PUT'])
@login_required
def update_vocabulary_notes(word):
    """Update notes for a word in user's vocabulary library"""
    user_id = request.current_user['user_id']
    data = request.get_json()
    
    if not data or 'notes' not in data:
        return jsonify({'error': '請提供筆記內容'}), 400
    
    notes = data.get('notes')
    
    success = VocabularyLibrary.update_word_notes(user_id, word, notes)
    
    if success:
        return jsonify({'message': '筆記已更新'})
    else:
        return jsonify({'error': '更新筆記失敗'}), 404

@quiz_bp.route('/api/vocabulary/<word>/review', methods=['POST'])
@login_required
def record_vocabulary_review(word):
    """Record that a word has been reviewed"""
    user_id = request.current_user['user_id']
    
    success = VocabularyLibrary.record_review(user_id, word)
    
    if success:
        return jsonify({'message': '單字複習記錄已更新'})
    else:
        return jsonify({'error': '更新複習記錄失敗'}), 404
