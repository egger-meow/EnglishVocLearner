#!/bin/bash
gunicorn run:run --workers=4 --bind=0.0.0.0:$PORT