
// Video Generation Service
// Handles client-side composition of static images into a video
// using HTML5 Canvas and MediaRecorder.

export interface VideoSourceImages {
    front?: File;
    side?: File;
    back?: File;
    detail?: File;
}

export interface VideoOptions {
    resolution: string; // '9:16', '16:9', '1:1'
    duration: number;   // seconds
    style: string;      // 'Studio Pan & Zoom', etc.
}

// UPGRADE: 60 FPS for high-end smooth motion
const FPS = 60;

// Helper to load image file into HTMLImageElement with resizing
const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Handle CORS if applicable
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = URL.createObjectURL(file);
    });
};

// Helper to calculate "cover" fit dimensions for aspect ratio
const getCoverDimensions = (imgWidth: number, imgHeight: number, targetWidth: number, targetHeight: number) => {
    const imgRatio = imgWidth / imgHeight;
    const targetRatio = targetWidth / targetHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > targetRatio) {
        // Image is wider than target
        drawHeight = targetHeight;
        drawWidth = targetHeight * imgRatio;
        offsetY = 0;
        offsetX = (targetWidth - drawWidth) / 2; // Center horizontally
    } else {
        // Image is taller than target
        drawWidth = targetWidth;
        drawHeight = targetWidth / imgRatio;
        offsetX = 0;
        offsetY = (targetHeight - drawHeight) / 2; // Center vertically
    }

    return { drawWidth, drawHeight, offsetX, offsetY };
};

export const generateCatalogVideo = async (images: VideoSourceImages, options: VideoOptions): Promise<string> => {
    // 1. Prepare assets
    const sequence: { img: HTMLImageElement; type: 'front' | 'side' | 'back' | 'detail' }[] = [];
    
    if (images.front) sequence.push({ img: await loadImage(images.front), type: 'front' });
    if (images.side) sequence.push({ img: await loadImage(images.side), type: 'side' });
    if (images.back) sequence.push({ img: await loadImage(images.back), type: 'back' });
    if (images.detail) sequence.push({ img: await loadImage(images.detail), type: 'detail' });

    if (sequence.length === 0) throw new Error("No images provided for video generation.");

    // 2. Setup Canvas based on Resolution Option
    const canvas = document.createElement('canvas');
    let width = 1080;
    let height = 1920;

    switch (options.resolution) {
        case '16:9':
            width = 1920;
            height = 1080;
            break;
        case '1:1':
            width = 1080;
            height = 1080;
            break;
        case '9:16':
        default:
            width = 1080;
            height = 1920;
            break;
    }

    canvas.width = width;
    canvas.height = height;
    
    // Attach canvas to DOM invisibly to prevent browser throttling/stopping rendering
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.opacity = '0'; 
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '-1000';
    document.body.appendChild(canvas);

    // UPGRADE: Enable high-quality image smoothing
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) {
        document.body.removeChild(canvas);
        throw new Error("Failed to create canvas context.");
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 3. Define Timing Constants (ms)
    const TOTAL_DURATION_MS = options.duration * 1000;
    const FADE_DURATION = 800;   
    
    const count = sequence.length;
    const SLIDE_DURATION = (TOTAL_DURATION_MS + ((count - 1) * FADE_DURATION)) / count;
    
    const ACTUAL_TOTAL_DURATION = (count * SLIDE_DURATION) - ((count - 1) * FADE_DURATION);

    // 4. Setup Recorder with High Bitrate (15 Mbps)
    const stream = canvas.captureStream(FPS);
    const mimeType = MediaRecorder.isTypeSupported('video/mp4; codecs=h264') 
        ? 'video/mp4; codecs=h264' 
        : 'video/webm; codecs=vp9';
    
    // 15 Mbps for crisp quality
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 15000000 });
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    const recordingPromise = new Promise<string>((resolve, reject) => {
        recorder.onstop = () => {
            if (document.body.contains(canvas)) {
                document.body.removeChild(canvas);
            }
            if (chunks.length === 0) {
                reject(new Error("Video generation failed: No data recorded."));
                return;
            }
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            resolve(url);
        };
        recorder.onerror = (e) => {
            if (document.body.contains(canvas)) document.body.removeChild(canvas);
            reject(e);
        };
    });

    recorder.start();

    // 5. Animation Loop
    let startTime: number | null = null;
    let animationFrameId: number;

    const render = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        
        if (elapsed >= ACTUAL_TOTAL_DURATION + 200) { 
            recorder.stop();
            cancelAnimationFrame(animationFrameId);
            return;
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        const stepTime = SLIDE_DURATION - FADE_DURATION;

        sequence.forEach((slide, index) => {
            const slideStart = index * stepTime;
            const slideEnd = slideStart + SLIDE_DURATION;

            if (elapsed >= slideStart && elapsed <= slideEnd) {
                // Local progress 0 -> 1
                let progress = (elapsed - slideStart) / SLIDE_DURATION;
                progress = Math.max(0, Math.min(1, progress)); 
                
                // Cross-fade Opacity
                let opacity = 1;
                if (index > 0) {
                    const fadeInPoint = FADE_DURATION / SLIDE_DURATION;
                    if (progress < fadeInPoint) {
                        opacity = progress / fadeInPoint;
                    }
                }
                if (index < sequence.length - 1) {
                    const fadeOutPoint = 1 - (FADE_DURATION / SLIDE_DURATION);
                    if (progress > fadeOutPoint) {
                        opacity = (1 - progress) / (1 - fadeOutPoint);
                    }
                }

                ctx.globalAlpha = opacity;

                const { drawWidth, drawHeight, offsetX, offsetY } = getCoverDimensions(slide.img.width, slide.img.height, width, height);
                
                let scale = 1;
                let panX = 0;
                let panY = 0;

                // UPGRADE: Quartic Easing for heavy, luxurious feel (t^4)
                // Starts very slow, ramps up, ends very slow.
                const easeQuart = (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
                
                const p = easeQuart(progress);
                const linearP = progress; // Use linear for some constant pans

                switch (options.style) {
                    case 'Zoom Focus':
                        // "Moving Forward" effect
                        // Subtle zoom: 1.0 -> 1.08 
                        scale = 1.0 + (0.08 * p); 
                        break;
                    
                    case 'Dynamic Pan':
                        // "Walking / Dolly" effect
                        // Reduced Pan range for stability (0.03 instead of 0.05)
                        scale = 1.15; 
                        if (index % 2 === 0) {
                            panX = -(width * 0.03) + (width * 0.06 * p);
                        } else {
                            panX = (width * 0.03) - (width * 0.06 * p);
                        }
                        break;

                    case '360° Turn':
                        // "Turn Around" effect
                        scale = 1.1;
                        // Move background Left to Right (simulates subject rotating Right to Left)
                        panX = -(width * 0.05) + (width * 0.1 * linearP);
                        break;

                    case 'Studio Pan & Zoom':
                    default:
                        // High-Level Mix
                        if (slide.type === 'front') {
                            scale = 1.0 + (0.06 * p); 
                        } else if (slide.type === 'side') {
                            scale = 1.1; 
                            panX = -(width * 0.03) + (width * 0.06 * p); 
                        } else if (slide.type === 'back') {
                            scale = 1.06 - (0.06 * p); 
                        } else { 
                            scale = 1.1;
                            panY = (height * 0.03) - (height * 0.06 * p);
                        }
                        break;
                }

                // Apply Transformations
                const scaledW = drawWidth * scale;
                const scaledH = drawHeight * scale;
                
                const centerX = offsetX + (drawWidth / 2);
                const centerY = offsetY + (drawHeight / 2);
                
                const finalX = centerX - (scaledW / 2) + panX;
                const finalY = centerY - (scaledH / 2) + panY;

                ctx.drawImage(slide.img, finalX, finalY, scaledW, scaledH);
                ctx.globalAlpha = 1;
            }
        });

        animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return recordingPromise;
};
