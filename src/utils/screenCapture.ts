export async function initializeCapture(): Promise<MediaStream | null> {
  try {
    // Request screen capture with specific display media constraints
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always',
        displaySurface: 'monitor',
      },
      audio: false
    });

    // Validate stream
    if (!stream || !stream.getVideoTracks().length) {
      throw new Error('No video track available');
    }

    return stream;
  } catch (error) {
    console.error('Error initializing screen capture:', error);
    return null;
  }
}

export async function captureScreen(stream: MediaStream): Promise<string | null> {
  try {
    const videoTrack = stream.getVideoTracks()[0];
    
    // Check if track is active before proceeding
    if (!videoTrack || !videoTrack.enabled || videoTrack.readyState !== 'live') {
      throw new Error('Video track is not active');
    }

    const imageCapture = new ImageCapture(videoTrack);
    const bitmap = await imageCapture.grabFrame();
    
    // Create canvas and draw the captured frame
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) return null;
    
    context.drawImage(bitmap, 0, 0);
    
    // Convert to base64 for storage and processing
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing screen:', error);
    return null;
  }
}