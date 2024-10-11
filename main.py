# from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_audioclips, AudioClip
# import numpy as np
import os


from flask import Flask, render_template

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return render_template('frontend/dist/index.html')

if __name__ == '__main__':
    app.run()