#!/bin/bash
gunicorn run:app --workers=4 --bind=0.0.0.0:$PORT