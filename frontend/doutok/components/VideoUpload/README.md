# 视频上传组件使用说明

## 功能特性

### 自动生成封面功能
- **VideoUpload** 组件现在支持自动从视频第一帧生成封面
- 当用户没有手动上传封面时，系统会自动提取视频的第一帧作为封面
- 支持手动上传封面覆盖自动生成的封面

### 使用方式

#### 1. VideoUpload 组件
新增的视频上传组件，支持自动生成封面：

```tsx
import { VideoUpload } from "@/components/VideoUpload/VideoUpload";

<VideoUpload
  name="video"
  accept="video/*"
  autoGenerateCover={true}  // 开启自动生成封面
  setParentComponentFileId={(fileId) => setVideoFileId(fileId)}
  setParentComponentFileObjectName={(objectName) => setVideoObjectName(objectName)}
  setParentComponentCoverObjectName={(objectName) => setCoverObjectName(objectName)}
  onVideoUploaded={(file) => console.log('视频上传完成', file)}
  onCoverGenerated={(coverFile) => console.log('封面生成完成', coverFile)}
>
  <Button>上传视频</Button>
</VideoUpload>
```

#### 2. 工具函数
可以独立使用的视频处理工具：

```tsx
import { extractVideoFirstFrame, blobToFile } from "@/utils/videoUtils";

// 提取视频第一帧
const coverBlob = await extractVideoFirstFrame(videoFile, 0.8);

// 转换为文件对象
const coverFile = blobToFile(coverBlob, 'cover.jpg', 'image/jpeg');
```

### 组件属性

#### VideoUpload Props
- `autoGenerateCover?: boolean` - 是否自动生成封面（默认 false）
- `onVideoUploaded?: (file: RcFile) => void` - 视频上传完成回调
- `onCoverGenerated?: (coverFile: File) => void` - 封面生成完成回调
- `setParentComponentCoverObjectName?: (objectName: string) => void` - 设置封面对象名称

#### 工具函数参数
- `extractVideoFirstFrame(videoFile: File, quality?: number)` 
  - `videoFile`: 视频文件对象
  - `quality`: 图片质量 0-1（默认 0.8）
  - 返回: `Promise<Blob>`

- `blobToFile(blob: Blob, fileName: string, mimeType?: string)`
  - `blob`: Blob 对象
  - `fileName`: 文件名
  - `mimeType`: MIME 类型（默认 'image/jpeg'）
  - 返回: `File`

### 用户体验

1. **用户上传视频** - 选择视频文件后开始上传
2. **自动生成封面** - 视频上传完成后，如果没有手动上传封面，系统自动提取第一帧
3. **可选手动上传** - 用户仍可以手动上传自定义封面覆盖自动生成的封面
4. **状态反馈** - 提供清晰的状态提示：
   - "视频上传成功"
   - "正在自动生成封面..."
   - "自动生成封面成功"
   - "✓ 已自动生成封面" / "✓ 已手动上传封面"

### 技术实现

1. **Canvas 渲染** - 使用 HTML5 Canvas 从视频提取帧画面
2. **Blob 转换** - 将 Canvas 内容转换为 JPEG 格式的 Blob
3. **文件上传** - 使用现有的文件上传流程上传生成的封面
4. **状态管理** - 通过 React state 管理封面生成状态和用户选择

### 注意事项

- 自动生成的封面为 JPEG 格式，质量为 80%
- 提取视频的第 0.1 秒作为封面（避免黑屏问题）
- 如果视频加载失败，会给出相应的错误提示
- 自动生成功能不会影响现有的手动上传封面流程
