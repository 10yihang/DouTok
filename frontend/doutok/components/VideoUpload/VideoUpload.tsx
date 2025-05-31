import { RequestComponent } from "@/components/RequestComponent/RequestComponent";
import { message, Upload, UploadProps } from "antd";
import React, { useEffect } from "react";
import { RcFile, UploadListType } from "antd/es/upload/interface";
import {
    FileServiceReportPublicFileUploadedResponse,
    ShortVideoCoreVideoServicePreSign4UploadCoverResponse,
    useFileServicePreSignUploadingPublicFile,
    useFileServiceReportPublicFileUploaded
} from "@/api/svapi/api";
import SparkMD5 from "spark-md5";
import { extractVideoFirstFrame, blobToFile, isValidVideoFile } from "@/utils/videoUtils";

export interface VideoUploadProps {
    className?: string;
    name: string;
    accept?: string;
    listType?: UploadListType;
    showUploadList?: boolean;
    children: React.ReactNode;
    onVideoUploaded?: (file: RcFile) => void;
    onCoverGenerated?: (coverFile: File) => void;
    setParentComponentFileObjectName?: (objectName: string) => void;
    setParentComponentFileId?: (fileId: string) => void;
    setParentComponentCoverObjectName?: (objectName: string) => void;
    autoGenerateCover?: boolean; // 是否自动生成封面
}

export function VideoUpload(props: VideoUploadProps) {
    const [reportFileId, setReportFileId] = React.useState<string>();
    const [uploadFile, setUploadFile] = React.useState<RcFile>();
    const [uploadUrl, setUploadUrl] = React.useState<string>();
    const [fileHash, setFileHash] = React.useState<string>();
    const [isGeneratingCover, setIsGeneratingCover] = React.useState<boolean>(false);

    const preSignUploadMutate = useFileServicePreSignUploadingPublicFile({});
    const reportUploadedMutate = useFileServiceReportPublicFileUploaded({});
    const preSignCoverUploadMutate = useFileServicePreSignUploadingPublicFile({});
    const reportCoverUploadedMutate = useFileServiceReportPublicFileUploaded({});

    const beforeUpload: UploadProps["beforeUpload"] = (file: RcFile) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (event: ProgressEvent<FileReader>) => {
            if (event === null || event.target === null) {
                return;
            }

            const hashHandle = new SparkMD5.ArrayBuffer();
            hashHandle.append(event.target.result as ArrayBuffer);
            setFileHash(hashHandle.end());
            setUploadFile(file);
        };

        return false;
    };

    // 上传生成的封面图片
    const uploadGeneratedCover = async (coverFile: File) => {
        try {
            setIsGeneratingCover(true);

            // 计算封面文件哈希
            const arrayBuffer = await coverFile.arrayBuffer();
            const hashHandle = new SparkMD5.ArrayBuffer();
            hashHandle.append(arrayBuffer);
            const coverHash = hashHandle.end();

            // 预签名封面上传
            const preSignResult = await preSignCoverUploadMutate.mutate({
                hash: coverHash,
                fileType: coverFile.type,
                size: coverFile.size.toString()
            });

            if (preSignResult?.code !== 0 || preSignResult.data === undefined) {
                message.error("封面上传预签名失败");
                return;
            }

            let coverFileId = (preSignResult.data as any).file_id || preSignResult.data.fileId;
            console.log("封面文件ID:", coverFileId);

            // 如果需要上传（非秒传）
            if (preSignResult.data.url) {
                const uploadResponse = await fetch(preSignResult.data.url, {
                    method: "PUT",
                    body: coverFile
                });

                if (uploadResponse.status !== 200) {
                    message.error("封面上传失败");
                    return;
                }
            }

            // 报告封面上传完成
            const reportResult = await reportCoverUploadedMutate.mutate({
                fileId: coverFileId
            });

            if (reportResult?.code !== 0 || reportResult?.data === undefined) {
                message.error("封面上传确认失败");
                return;
            }

            // 设置封面对象名称
            const objectName = (reportResult.data as any).object_name;
            if (props.setParentComponentCoverObjectName && objectName) {
                console.log("设置封面对象名:", objectName);
                props.setParentComponentCoverObjectName(objectName);
            }

            if (props.onCoverGenerated) {
                props.onCoverGenerated(coverFile);
            }

            // 注意：不在这里显示success消息，因为在调用方处理
        } catch (error) {
            console.error("上传封面失败:", error);
            message.error("自动生成封面失败");
        } finally {
            setIsGeneratingCover(false);
        }
    };

    useEffect(() => {
        if (fileHash === undefined || uploadFile === undefined) {
            return;
        }

        preSignUploadMutate
            .mutate({
                hash: fileHash,
                fileType: uploadFile.type,
                size: uploadFile.size.toString()
            })
            .then((result: ShortVideoCoreVideoServicePreSign4UploadCoverResponse) => {
                console.log("preSignUploadMutate 完整响应:", result);

                if (result?.code !== 0 || result.data === undefined) {
                    message.error("上传失败，请重试");
                    return;
                }

                setUploadUrl(result.data.url);

                if (props.onVideoUploaded) {
                    props.onVideoUploaded(uploadFile);
                }

                if (result.data.url === undefined) {
                    // 触发秒传
                    const fileId = (result.data as any).file_id;
                    console.log("触发秒传，设置 reportFileId:", fileId);
                    setReportFileId(fileId);
                    return;
                }

                fetch(result.data.url as string, {
                    method: "PUT",
                    body: uploadFile
                }).then(response => {
                    console.log("文件上传响应:", response.status);
                    if (response.status !== 200) {
                        message.error("上传失败，请重试");
                        return;
                    }

                    const fileId = (result.data as any)?.file_id;
                    console.log("设置 reportFileId:", fileId);
                    setReportFileId(fileId);
                });
            });
    }, [fileHash, uploadFile]);

    useEffect(() => {
        console.log("reportFileId 状态变化:", reportFileId);
        if (reportFileId === undefined) {
            return;
        }

        reportUploadedMutate
            .mutate({
                fileId: reportFileId
            })
            .then(async (result: FileServiceReportPublicFileUploadedResponse) => {
                console.log("reportUploadedMutate 回调执行", { result, reportFileId });
                console.log("完整的result.data:", result.data);

                if (result?.code !== 0 || result?.data === undefined) {
                    message.error("上传失败，请重试");
                    return;
                }

                const objectName = (result.data as any).object_name;
                if (props.setParentComponentFileObjectName && objectName) {
                    console.log("设置父组件文件对象名:", objectName);
                    props.setParentComponentFileObjectName(objectName);
                }

                if (props.setParentComponentFileId) {
                    console.log("设置父组件文件ID:", reportFileId);
                    props.setParentComponentFileId(reportFileId);
                }

                message.success("视频上传成功");

                // 如果启用自动生成封面且上传文件是视频
                if (props.autoGenerateCover && uploadFile && uploadFile.type.startsWith('video/')) {
                    try {
                        message.info("正在自动生成封面...");
                        const coverBlob = await extractVideoFirstFrame(uploadFile, 0.8);
                        const coverFile = blobToFile(
                            coverBlob,
                            `cover_${uploadFile.name.replace(/\.[^/.]+$/, "")}.jpg`,
                            'image/jpeg'
                        );

                        await uploadGeneratedCover(coverFile);
                    } catch (error) {
                        console.error("生成封面失败:", error);
                        const errorMessage = error instanceof Error ? error.message : '未知错误';
                        message.warning(`自动生成封面失败: ${errorMessage}，请手动上传封面`);
                    }
                }
            });
    }, [reportFileId]);

    return (
        <RequestComponent noAuth={false}>
            <Upload
                action={uploadUrl}
                className={props.className}
                name={props.name}
                accept={props.accept}
                listType={props.listType}
                showUploadList={props.showUploadList}
                beforeUpload={beforeUpload}
                disabled={isGeneratingCover}
            >
                {props.children}
            </Upload>
        </RequestComponent>
    );
}
