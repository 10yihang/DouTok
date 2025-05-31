/**
 * 检查视频文件是否有效
 * @param videoFile 视频文件
 * @returns Promise<boolean> 视频是否有效
 */
export const isValidVideoFile = (videoFile: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const video = document.createElement('video');

        video.onloadedmetadata = () => {
            if (video.src) {
                URL.revokeObjectURL(video.src);
            }
            resolve(true);
        };

        video.onerror = (error) => {
            console.error('视频验证失败:', error);
            if (video.src) {
                URL.revokeObjectURL(video.src);
            }
            resolve(false);
        };

        try {
            const videoUrl = URL.createObjectURL(videoFile);
            console.log('验证视频URL:', videoUrl);
            video.src = videoUrl;
        } catch (error) {
            console.error('创建验证视频URL失败:', error);
            resolve(false);
        }
    });
};

/**
 * 从视频文件中提取第一帧作为封面图片
 * @param videoFile 视频文件
 * @param quality 图片质量 (0-1)
 * @returns Promise<Blob> 返回图片 Blob
 */
export const extractVideoFirstFrame = (
    videoFile: File,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        // 检查文件类型
        if (!videoFile.type.startsWith('video/')) {
            reject(new Error('不是有效的视频文件'));
            return;
        }

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('无法创建 Canvas 上下文'));
            return;
        }

        let videoUrl: string | null = null;

        // 添加超时机制
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('视频处理超时'));
        }, 15000); // 15秒超时

        const cleanup = () => {
            clearTimeout(timeout);
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
                videoUrl = null;
            }
            video.src = '';
            video.removeAttribute('src');
            video.load();
        };

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        video.onloadedmetadata = () => {
            console.log('视频元数据加载成功:', {
                duration: video.duration,
                videoWidth: video.videoWidth,
                videoHeight: video.videoHeight,
                readyState: video.readyState
            });

            if (video.videoWidth === 0 || video.videoHeight === 0) {
                cleanup();
                reject(new Error('视频尺寸无效'));
                return;
            }

            // 设置 canvas 尺寸
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 设置视频时间到一个稍微靠后的位置来避免黑屏
            const seekTime = Math.min(0.5, video.duration * 0.1); // 0.5秒或视频时长的10%
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            try {
                console.log('视频定位完成，开始截取帧');

                // 绘制视频帧到 canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // 转换为 Blob
                canvas.toBlob(
                    (blob) => {
                        cleanup();
                        if (blob) {
                            console.log('封面生成成功，大小:', blob.size);
                            resolve(blob);
                        } else {
                            reject(new Error('无法生成图片'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            } catch (error) {
                cleanup();
                reject(error);
            }
        };

        video.onerror = (error) => {
            cleanup();
            console.error('视频加载错误:', error, {
                videoSrc: video.src,
                videoFile: videoFile.name,
                videoType: videoFile.type,
                videoSize: videoFile.size
            });
            reject(new Error(`视频加载失败: ${videoFile.name} (${videoFile.type})`));
        };

        // 加载视频
        console.log('开始加载视频:', {
            name: videoFile.name,
            type: videoFile.type,
            size: videoFile.size
        });

        try {
            videoUrl = URL.createObjectURL(videoFile);
            console.log('创建的视频URL:', videoUrl);

            // 确保URL是有效的blob URL
            if (!videoUrl.startsWith('blob:')) {
                throw new Error('创建的URL不是有效的blob URL');
            }

            video.src = videoUrl;
        } catch (error) {
            cleanup();
            console.error('创建视频URL失败:', error);
            reject(new Error('无法创建视频预览'));
            return;
        }
    });
};

/**
 * 将 Blob 转换为 File 对象
 * @param blob Blob 对象
 * @param fileName 文件名
 * @param mimeType MIME 类型
 * @returns File 对象
 */
export const blobToFile = (
    blob: Blob,
    fileName: string,
    mimeType: string = 'image/jpeg'
): File => {
    return new File([blob], fileName, { type: mimeType });
};
