"use client";

import React, { useState } from "react";
import Search from "antd/es/input/Search";
import { SearchProps } from "antd/lib/input";
import { Modal, Tabs, List, Avatar, Typography, Spin, message } from "antd";
import { UserOutlined, PlayCircleOutlined } from "@ant-design/icons";

import "./MainSearch.css";
import { SearchOutlined } from "@ant-design/icons";
import { useSearchServiceSearch, SvapiContentSearchRequest, SvapiContentSearchResponse, SvapiUser, SvapiVideo } from "../../api/svapi/api";
import { PlayerModal } from "@/components/PlayerModal/PlayerModal";

const { Text, Title } = Typography;

// 搜索类型常量
const SEARCH_TYPE = {
  ALL: 0,
  VIDEO: 1,
  USER: 2,
} as const;

// 包装响应类型
interface WrappedResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export function MainSearch() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SvapiContentSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 播放器状态
  const [openPlayer, setOpenPlayer] = useState(false);
  const [playUrl, setPlayUrl] = useState("");
  const [videoInfo, setVideoInfo] = useState<SvapiVideo>();
  const [publisher, setPublisher] = useState("");
  const [description, setDescription] = useState("");

  const searchMutate = useSearchServiceSearch({}); const onSearch: SearchProps["onSearch"] = async (value, _e, info) => {
    console.log(info?.source, value);
    setSearchQuery(value);
    setIsModalVisible(true);
    setLoading(true);

    try {
      // 发起搜索请求
      const searchRequest: SvapiContentSearchRequest = {
        query: value,
        type: SEARCH_TYPE.ALL,
        pagination: {
          page: 1,
          size: 20
        }
      };

      const response = await searchMutate.mutate(searchRequest) as WrappedResponse<SvapiContentSearchResponse>;

      if (response.code === 0) {
        setSearchResults(response.data);
      } else {
        message.error(response.msg || '搜索失败');
        setSearchResults(null);
      }
    } catch (error) {
      console.error('搜索出错:', error);
      message.error('搜索出错，请重试');
      setSearchResults(null);
    } finally {
      setLoading(false);
    }
  };
  const handleCancel = () => {
    setIsModalVisible(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  const searchTabs = [
    {
      key: "all",
      label: "全部",
      children: (
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {/* 用户搜索结果 */}
          {searchResults?.users && searchResults.users.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>用户</Title>
              <List
                dataSource={searchResults.users}
                renderItem={(user) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                      title={user.name}
                      description={`关注: ${user.followCount || 0} | 粉丝: ${user.followerCount || 0}`}
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 视频搜索结果 */}
          {searchResults?.videos && searchResults.videos.length > 0 && (
            <div>
              <Title level={4}>视频</Title>              <List
                dataSource={searchResults.videos}
                renderItem={(video) => (
                  <List.Item
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setPlayUrl(
                        `http://localhost:9000/shortvideo/${(video as any).play_url}`
                      );
                      setPublisher(video.author?.name || "未知用户");
                      setDescription(video.title || "暂无描述");
                      setVideoInfo(video);
                      setOpenPlayer(true);
                      setIsModalVisible(false); // 关闭搜索模态框
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ position: 'relative' }}>
                          <img
                            src={`http://localhost:9000/shortvideo/${video.cover_url}`}
                            alt={video.title}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                          />
                          <PlayCircleOutlined
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              color: 'white',
                              fontSize: 24
                            }}
                          />
                        </div>
                      }
                      title={video.title}
                      description={
                        <div>
                          <Text>@{video.author?.name}</Text>
                          <br />
                          <Text type="secondary">点赞: {video.favoriteCount || 0} | 评论: {video.commentCount || 0}</Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          )}

          {/* 无结果 */}
          {searchResults && (!searchResults.users || searchResults.users.length === 0) &&
            (!searchResults.videos || searchResults.videos.length === 0) && (
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Text type="secondary">未找到相关内容</Text>
              </div>
            )}
        </div>
      ),
    },
  ];
  return (
    <>
      <Search
        className={"search"}
        placeholder="搜索你的兴趣"
        allowClear
        enterButton={
          <div className={"search-button"}>
            <SearchOutlined /> 搜索
          </div>
        }
        size="large"
        onSearch={onSearch}
      />

      <Modal
        title={`搜索: ${searchQuery}`}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={600}
      >
        <Spin spinning={loading}>
          <Tabs defaultActiveKey="all" items={searchTabs} />
        </Spin>
      </Modal>

      {/* 播放器模态框 */}
      {openPlayer && (
        <PlayerModal
          open={openPlayer}
          onCancel={() => setOpenPlayer(false)}
          onClose={() => setOpenPlayer(false)}
          playUrl={playUrl}
          username={publisher}
          description={description}
          videoInfo={videoInfo as SvapiVideo}
          onLastOne={() => {
            message.info("已经是第一个了");
          }}
          onNextOne={() => {
            message.info("已经是最后一个了");
          }}
        />
      )}
    </>
  );
}
