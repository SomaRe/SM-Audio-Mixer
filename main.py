from moviepy.editor import VideoFileClip, AudioFileClip, concatenate_audioclips, AudioClip
import numpy as np
import os

def process_video(video_path, audio_path=None, output_path='output_video.mp4'):
    # Check if video file exists
    if not os.path.isfile(video_path):
        print(f"Video file {video_path} does not exist.")
        return
    
    # Load the video file
    video_clip = VideoFileClip(video_path)
    print(f"Loaded video '{video_path}' - duration: {video_clip.duration}s")

    # Remove audio from the video
    video_clip = video_clip.without_audio()
    print("Removed audio from the video.")

    if audio_path and os.path.isfile(audio_path):
        # Load the audio file
        audio_clip = AudioFileClip(audio_path)
        print(f"Loaded audio '{audio_path}' - duration: {audio_clip.duration}s")
        
        # Adjust the audio duration to match the video duration
        if audio_clip.duration > video_clip.duration:
            # Trim the audio to match the video duration
            audio_clip = audio_clip.subclip(0, video_clip.duration)
            print(f"Trimmed audio to {video_clip.duration}s to match video duration.")
        elif audio_clip.duration < video_clip.duration:
            # Generate silence to pad the audio
            silence_duration = video_clip.duration - audio_clip.duration
            fps = audio_clip.fps
            silence_clip = AudioClip(lambda t: 0, duration=silence_duration, fps=fps)
            
            # Concatenate the original audio with silence
            audio_clip = concatenate_audioclips([audio_clip, silence_clip])
            print(f"Padded audio with {silence_duration}s of silence to match video duration.")
        
        # Add the new audio to the video
        video_clip = video_clip.set_audio(audio_clip)
        print("Added new audio to the video.")
    else:
        print("No audio file provided or file does not exist. Video will remain silent.")

    # Write the output video file
    video_clip.write_videofile(output_path, codec='libx264', audio_codec='aac')
    print(f"Processed video saved as '{output_path}'")

# Example usage
video_file = 'input_video.mp4'      # Path to your input video file
audio_file = 'input_audio.mp3'      # Path to your input audio file
output_file = 'output_video.mp4'    # Path for the output video file

process_video(video_file, audio_file, output_file)