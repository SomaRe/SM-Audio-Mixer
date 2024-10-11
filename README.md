# Video and Audio Editor Project Report

## Overview

This project involves the development of a web-based video and audio editor. The application allows users to:

- Upload a video file.
- Extract audio from video and an option to upload additional **Music**.
- Adjust the volume of each audio track independently at different points in the timeline using bezier curves.
- Provide a preview of the edited video with audio adjustments.

The goal is to provide a user-friendly interface where users can seamlessly edit their videos with customized audio enhancements.

## Features

1. **Video Upload Functionality**: Users can upload their own video files for editing.
2. **Audio Track Uploads**:
   - **Voice Track**: Extracted from Video, typically voice-over or narration.
   - **Music Track**: Background music to enhance the video.
3. **Timeline-Based Volume Control**:
   - Interactive timeline where users can adjust the volume of each audio track.
   - Volume adjustments are smooth, utilizing bezier curve.
4. **Web-Based Editing Interface**: An intuitive and responsive interface accessible via web browsers.
5. **Future: Python Backend Processing**: Heavy-lifting tasks handled by a Python backend for efficient processing.
6. **Future: WebGPU Support**: GPU-accelerated processing for improved performance utilizing users GPU.

## Technical Stack

- **Frontend**:
  - **Languages**: HTML, CSS, JavaScript.
  - **Framework**: React.js
- **Backend**:
  - **Language**: Python.
  - **Framework**: Flask
- **Future: Audio Processing**:
  - **Libraries**: `pydub`, `moviepy` (for audio manipulation and processing).

## Implementation Plan

### 1. Frontend Development

**a. User Interface**

- **File Upload Components**:
  - Implement components for uploading video and audio files.
  - Ensure validation for supported file types and sizes.
- **Timeline Component**:
  - Design an interactive timeline to visualize the video and audio tracks.
  - Allow users to navigate through the video frames.
- **Volume Control UI**:
  - Develop draggable lines or nodes on the timeline representing volume levels.
  - Implement smooth adjustments using curves (bezier curves) for seamless volume transitions.
    - Users can click and drag points on the line to adjust volume levels.
    - Pulling down decreases volume; pulling up increases volume.
- **Preview Component**:
  - Provide real-time playback of the edited video with audio adjustments.
  - Include playback controls (play, pause, stop, etc.).

**b. Responsiveness and Design**

- Future: Ensure the interface is responsive and works well on various screen sizes and devices.
- Apply consistent styling and theming for a professional look.

### 2. Future: Backend Development

**a. Server Setup**

- Set up a Python web server using **Flask** or **FastAPI**.
- Configure CORS if frontend and backend are on different domains.

**b. API Endpoints**

- **File Upload Handlers**:
  - Accept uploaded video and audio files.
  - Store files securely on the server.
- **Video Information Retrieval**:
  - Endpoint to retrieve video metadata (duration, format, frame rate).
- **Audio Processing**:
  - Endpoints for:
    - Extracting waveforms.
    - Applying volume changes based on frontend input.
    - Merging multiple audio tracks.
- **File Merging and Downloading**:
  - Process and combine video with adjusted audio tracks.
  - Provide a downloadable link or initiate download upon completion.

### 3. Future: Audio Processing

**a. Audio Extraction and Manipulation**

- **Extract Audio from Video**:
  - Use `moviepy` to extract the audio track from the uploaded video if needed.
- **Adjust Volume Levels**:
  - Implement functions to adjust volume based on control points from the frontend.
  - Utilize interpolation between points for smooth transitions.
- **Merge Audio Tracks**:
  - Overlay the voice and music tracks onto the original or extracted audio.
  - Ensure synchronization with the video timeline.

**b. Future: Final Video Generation**

- Combine the edited audio with the original video using `moviepy`.
- Handle encoding and ensure the final video maintains quality and synchronization.

### 4. Data Flow Overview

1. **File Upload**:
   - User uploads video and audio files via the frontend.
   - Files are sent to the backend server.
2. **Processing and Information Retrieval**:
   - Backend processes the files and extracts necessary metadata.
   - Metadata is sent back to the frontend to set up the timeline.
3. **User Interaction**:
   - User adjusts volume levels on the timeline interface.
   - Adjustments are represented as data points (e.g., time and volume level).
4. **Volume Change Submission**:
   - Volume adjustment data is sent to the backend.
5. **Backend Processing**:
   - Backend applies volume changes to the audio tracks.
   - Merges the adjusted audio tracks with the video.
6. **Final Output**:
   - The backend generates the final video file.
   - Provides the user with a download link or automatic download.