"use client";

import { Button, Divider, Form, message, Modal } from "antd";
import {
  ProForm,
  ProFormItem,
  ProFormText,
  ProFormTextArea
} from "@ant-design/pro-form";
import { RequestComponent } from "@/components/RequestComponent/RequestComponent";
import { PlusOutlined } from "@ant-design/icons";
import React from "react";
import {
  ShortVideoCoreVideoServiceReportVideoFinishUploadResponse,
  useShortVideoCoreVideoServiceReportVideoFinishUpload
} from "@/api/svapi/api";
import { SimpleUpload } from "@/components/SimpleUpload/SimpleUpload";
import { VideoUpload } from "@/components/VideoUpload/VideoUpload";

export function Publish() {
  const [open, setOpen] = React.useState(false);

  const [videoFileId, setVideoFileId] = React.useState<string>();
  const [videoFileObjectName, setVideoFileObjectName] =
    React.useState<string>(); const [coverFileObjectName, setCoverFileObjectName] =
      React.useState<string>();
  const [hasCover, setHasCover] = React.useState<boolean>(false);

  const reportVideoUploadedMutate =
    useShortVideoCoreVideoServiceReportVideoFinishUpload({});

  const [formRef] = Form.useForm(); const reportUploadVideo = (formData: Record<string, string>) => {
    console.log("提交视频，当前状态:", {
      videoFileId,
      videoFileObjectName,
      coverFileObjectName,
      formData
    });

    if (videoFileId === undefined) {
      message.error("请上传视频");
      return;
    }

    reportVideoUploadedMutate
      .mutate({
        fileId: videoFileId,
        title: formData?.title,
        videoUrl: videoFileObjectName,
        coverUrl: coverFileObjectName,
        description: formData?.description
      })
      .then(
        (result: ShortVideoCoreVideoServiceReportVideoFinishUploadResponse) => {
          if (result?.code !== 0 || result?.data === undefined) {
            message.error("上传失败，请重试");
            return;
          }
        }
      );

    window.location.reload();
  };

  return (
    <>
      <Button
        className={"publish-button"}
        type={"primary"}
        icon={<PlusOutlined />}
        onClick={() => {
          setOpen(true);
        }}
      >
        发布
      </Button>
      {open && (
        <RequestComponent noAuth={false}>
          <Modal open={open} onCancel={() => setOpen(false)} footer={null}>
            <ProForm form={formRef} onFinish={reportUploadVideo}>
              <ProFormText
                name={"title"}
                label={"标题"}
                placeholder={"请输入标题"}
                rules={[
                  {
                    required: true,
                    message: "请输入视频标题"
                  }
                ]}
              />
              <ProFormTextArea
                name={"description"}
                label={"视频描述"}
                placeholder={"请输入视频描述"}
                rules={[
                  {
                    required: true,
                    message: "请输入视频描述"
                  }]}
              />              <ProFormItem name={"video"}>
                <VideoUpload
                  name={"video"}
                  accept={"video/*"}
                  autoGenerateCover={!hasCover} // 只有在没有手动上传封面时才自动生成
                  setParentComponentFileId={(fileId: string) => {
                    console.log("接收到视频文件ID:", fileId);
                    setVideoFileId(fileId);
                  }}
                  setParentComponentFileObjectName={(objectName: string) => {
                    setVideoFileObjectName(objectName);
                  }}
                  setParentComponentCoverObjectName={(objectName: string) => {
                    setCoverFileObjectName(objectName);
                  }}
                  onVideoUploaded={() => {
                    console.log("视频上传成功");
                  }}
                  onCoverGenerated={() => {
                    message.success("✓ 已自动生成封面");
                  }}
                >
                  <Button>上传视频</Button>
                </VideoUpload>              </ProFormItem>
              <Divider />

              {/* 调试信息 */}
              {process.env.NODE_ENV === 'development' && (
                <div style={{ background: '#f0f0f0', padding: 8, marginBottom: 16, fontSize: 12 }}>
                  <strong>调试信息:</strong><br />
                  视频文件ID: {videoFileId || '未设置'}<br />
                  视频对象名: {videoFileObjectName || '未设置'}<br />
                  封面对象名: {coverFileObjectName || '未设置'}<br />
                  手动上传封面: {hasCover ? '是' : '否'}
                </div>
              )}

              <ProFormItem name={"cover"} label={"视频封面（可选）"}>
                <SimpleUpload
                  name={"cover"}
                  accept={"image/*"}
                  setParentComponentFileObjectName={(objectName: string) => {
                    setCoverFileObjectName(objectName);
                    setHasCover(true); // 标记已手动上传封面
                  }}
                >
                  <Button>手动上传封面（可选）</Button>
                </SimpleUpload>
                {!hasCover && coverFileObjectName && (
                  <div style={{ marginTop: 8, color: '#52c41a' }}>
                    ✓ 已自动生成封面
                  </div>
                )}
                {hasCover && (
                  <div style={{ marginTop: 8, color: '#52c41a' }}>
                    ✓ 已手动上传封面
                  </div>
                )}
              </ProFormItem>
              <Divider />
            </ProForm>
          </Modal>
        </RequestComponent>
      )}
    </>
  );
}
