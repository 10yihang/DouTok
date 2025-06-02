"use client";

import React, { useEffect, useRef, useState } from "react";
import "plyr-react/plyr.css";
import "./Player.css";
import { SourceInfo } from "plyr";
import { Button, Drawer, message } from "antd";
import Avatar from "antd/es/avatar/avatar";
import {
  CheckOutlined,
  HeartFilled,
  HeartOutlined,
  MessageFilled,
  MessageOutlined,
  ShareAltOutlined,
  StarFilled,
  StarOutlined
} from "@ant-design/icons";
import {
  CollectionServiceAddVideo2CollectionResponse,
  FavoriteServiceAddFavoriteResponse,
  FollowServiceAddFollowResponse,
  SvapiVideo,
  useCollectionServiceAddVideo2Collection,
  useCollectionServiceRemoveVideoFromCollection,
  useFavoriteServiceAddFavorite,
  useFavoriteServiceRemoveFavorite,
  useFollowServiceAddFollow,
  useFollowServiceRemoveFollow
} from "@/api/svapi/api";
import { APITypes, PlyrProps, usePlyr } from "plyr-react";
import { CommentComponent } from "@/components/Player/CommentComponent/CommentComponent";

const CustomPlyrInstance = React.forwardRef<APITypes, PlyrProps>(
  (props, ref) => {
    const { source, options = null } = props;
    const raptorRef = usePlyr(ref, {
      source,
      options
    }) as React.MutableRefObject<HTMLVideoElement>;

    // 暴露plyr实例到父组件
    React.useImperativeHandle(ref, () => ({
      plyr: (raptorRef.current as any)?.plyr
    }));

    return <video ref={raptorRef} className="plyr-react plyr" />;
  }
);
CustomPlyrInstance.displayName = "CustomPlyrInstance";

interface CorePlayerProps {
  title: string;
  sources?: SourceInfo;
  src: string;
}

const CorePlayer = (props: CorePlayerProps, ref: any) => {
  return (
    <CustomPlyrInstance
      ref={ref}
      source={{
        type: "video",
        title: props.title,
        sources:
          props.sources !== undefined
            ? props.sources
            : [
              {
                src: props.src
              }
            ]
      }}
      options={{
        ratio: "16:9",
        autoplay: false,
        hideControls: false
      }}
    />
  );
};

const CorePlayerMemorized = React.memo(React.forwardRef(CorePlayer));

export interface PlayerProps {
  src?: string;
  sources?: SourceInfo;
  title: string;
  avatar?: string;
  username?: string;
  description?: string;
  userId: string;
  isCouldFollow?: boolean;
  videoInfo: SvapiVideo;
  displaying: boolean;
  useExternalCommentDrawer: boolean;
  onOpenExternalCommentDrawer?: () => void;
  onPreviousVideo?: () => void;
  onNextVideo?: () => void;
}

// 保留注释，未来会优化播放器组件
// const Plyr = dynamic(() => import("plyr-react"), { ssr: false });

export function Player(props: PlayerProps) {
  const playerRef = useRef();

  const [haveSource, setHaveSource] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  // 能否关注
  const [isCouldFollow, setIsCouldFollow] = useState(props.isCouldFollow);
  // 是否已关注
  const [isFollowed, setIsFollowed] = useState(false);
  const [isCollected, setIsCollected] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [videoSource, setVideoSource] = useState("");
  const [openCommentDrawer, setOpenCommentDrawer] = useState(false);

  useEffect(() => {
    setHaveSource(true);
  }, []);

  // 监听播放器实例状态
  useEffect(() => {
    const checkPlayerReady = () => {
      const currentPlayer = (playerRef.current as any)?.plyr;
      if (currentPlayer && typeof currentPlayer.play === 'function') {
        setPlayerReady(true);
      } else {
        setPlayerReady(false);
      }
    };

    checkPlayerReady();
    // 定期检查播放器状态，直到就绪
    const interval = setInterval(checkPlayerReady, 100);

    // 5秒后停止检查
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [videoSource]);

  useEffect(() => {
    setVideoSource(props.src as string);
    setIsCouldFollow(props.isCouldFollow);
    setIsFollowed(props.videoInfo.author?.isFollowing === true);
    setIsCollected(props.videoInfo.isCollected === true);
    setIsFavorite(props.videoInfo.isFavorite === true);
  }, [props.isCouldFollow, props.videoInfo]);  // 键盘事件监听，支持w/s键、上下方向键切换视频和空格键暂停/播放
  useEffect(() => {
    // 检查是否在客户端环境
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // 只在当前视频显示时处理键盘事件
      if (!props.displaying) {
        return;
      }

      // 检查是否在输入框中，如果是则不处理键盘事件
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      switch (event.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          event.preventDefault();
          props.onPreviousVideo?.();
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          event.preventDefault();
          props.onNextVideo?.();
          break; case ' ':
          event.preventDefault();
          // 只有在播放器就绪时才尝试控制播放
          if (!playerReady) {
            console.warn('Player not ready yet');
            return;
          }

          // 获取当前plyr实例并切换播放状态
          const currentPlayer = (playerRef.current as any)?.plyr;
          if (currentPlayer && typeof currentPlayer.play === 'function' && typeof currentPlayer.pause === 'function') {
            try {
              if (currentPlayer.playing) {
                currentPlayer.pause();
              } else {
                currentPlayer.play().catch((error: any) => {
                  console.warn('Error playing video:', error);
                });
              }
            } catch (error) {
              console.warn('Error controlling video playback:', error);
            }
          }
          break;
      }
    }; document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.displaying, props.onPreviousVideo, props.onNextVideo, playerReady]);// 处理视频切换时停止旧视频播放
  useEffect(() => {
    const currentPlayer = (playerRef.current as any)?.plyr;

    if (currentPlayer && typeof currentPlayer.pause === 'function') {
      if (props.displaying) {
        // 当视频变为显示状态时，确保其他视频都已停止
        // 这里我们不自动播放，让用户决定是否播放
      } else {
        // 当视频变为非显示状态时，立即停止播放
        try {
          if (currentPlayer.playing) {
            currentPlayer.pause();
          }
          // 重置播放位置到开始
          if (typeof currentPlayer.currentTime !== 'undefined') {
            currentPlayer.currentTime = 0;
          }
          // 确保视频完全停止
          if (typeof currentPlayer.stop === 'function') {
            currentPlayer.stop();
          }
        } catch (error) {
          // 忽略可能的错误，例如视频尚未加载完成
          console.warn('Error stopping video:', error);
        }
      }
    }
  }, [props.displaying, props.src]);
  // 添加一个清理函数，确保组件卸载时停止视频
  useEffect(() => {
    return () => {
      const currentPlayer = (playerRef.current as any)?.plyr;
      if (currentPlayer && typeof currentPlayer.pause === 'function') {
        try {
          if (currentPlayer.playing) {
            currentPlayer.pause();
          }
          if (typeof currentPlayer.currentTime !== 'undefined') {
            currentPlayer.currentTime = 0;
          }
          if (typeof currentPlayer.stop === 'function') {
            currentPlayer.stop();
          }
        } catch (error) {
          console.warn('Error cleaning up video:', error);
        }
      }
    };
  }, []);

  const addFollowMutate = useFollowServiceAddFollow({});
  const addFollowHandle = () => {
    addFollowMutate
      .mutate({
        userId: props.userId
      })
      .then((result: FollowServiceAddFollowResponse) => {
        if (result?.code !== 0) {
          message.error("关注失败");
          return;
        }

        message.info("关注成功");
        setIsFollowed(true);
      });
  };

  const removeFollowMutate = useFollowServiceRemoveFollow({});
  const removeFollowMutateHandle = () => {
    removeFollowMutate
      .mutate({
        userId: props.userId
      })
      .then((result: FollowServiceAddFollowResponse) => {
        if (result?.code !== 0) {
          message.error("取消关注失败");
          return;
        }

        message.info("取消关注成功");
        setIsFollowed(false);
      });
  };

  const addFavoriteMutate = useFavoriteServiceAddFavorite({});
  const addFavoriteHandle = () => {
    addFavoriteMutate
      .mutate({
        id: props.videoInfo.id,
        target: 0,
        type: 0
      })
      .then((result: FavoriteServiceAddFavoriteResponse) => {
        if (result?.code !== 0) {
          message.error("点赞失败");
          return;
        }

        message.info("点赞成功");
        setIsFavorite(true);
      });
  };

  const removeFavoriteMutate = useFavoriteServiceRemoveFavorite({});
  const removeFavoriteHandle = () => {
    removeFavoriteMutate
      .mutate({
        id: props.videoInfo.id,
        target: 0,
        type: 0
      })
      .then((result: FavoriteServiceAddFavoriteResponse) => {
        if (result?.code !== 0) {
          message.error("取消点赞失败");
          return;
        }

        message.info("取消点赞成功");
        setIsFavorite(false);
      });
  };

  const addVideo2DefaultCollectionMutate =
    useCollectionServiceAddVideo2Collection({});
  const addVideo2DefaultCollectionHandle = () => {
    addVideo2DefaultCollectionMutate
      .mutate({
        videoId: props.videoInfo.id
      })
      .then((result: CollectionServiceAddVideo2CollectionResponse) => {
        if (result?.code !== 0) {
          message.error("收藏失败");
          return;
        }

        message.info("收藏成功");
        setIsCollected(true);
      });
  };

  const removeVideoFromDefaultCollectionMutate =
    useCollectionServiceRemoveVideoFromCollection({});
  const removeVideoFromDefaultCollectionHandle = () => {
    removeVideoFromDefaultCollectionMutate
      .mutate({
        videoId: props.videoInfo.id
      })
      .then((result: CollectionServiceAddVideo2CollectionResponse) => {
        if (result?.code !== 0) {
          message.error("取消收藏失败");
          return;
        }

        message.info("取消收藏成功");
        setIsCollected(false);
      });
  };

  return (
    <div
      className={"player"}
      style={
        !haveSource
          ? {
            position: "absolute",
            top: "-100%",
            left: "-100%",
            opacity: 0
          }
          : {}
      }
    >
      <Drawer
        title={"评论"}
        open={openCommentDrawer}
        placement={"left"}
        closable={true}
        onClose={() => {
          setOpenCommentDrawer(false);
        }}
        mask={false}
        destroyOnClose={true}
      >
        <CommentComponent videoId={props.videoInfo.id} />
      </Drawer>
      <div
        className={"mask"}
        style={{
          color: "white"
        }}
      >
        <div className={"down-left"}>
          <div className={"publish-user-name"}>
            <div
              style={{
                fontSize: "30px"
              }}
            >
              @{props.username}
            </div>
            <div
              style={{
                fontSize: "20px"
              }}
            >
              {props.description}
            </div>
          </div>
        </div>
        <div className={"down-right"}>
          <div className={"mask-button-container"}>
            <div>
              <Avatar className={"mask-button"} src={props.avatar} size={70} />
            </div>
            <div className={"follow-button"}>
              {isCouldFollow && !isFollowed && (
                <Button
                  size={"small"}
                  block={true}
                  style={{
                    pointerEvents: "all"
                  }}
                  onClick={addFollowHandle}
                >
                  关注
                </Button>
              )}
              {isCouldFollow && isFollowed && (
                <Button
                  size={"small"}
                  block={true}
                  style={{
                    pointerEvents: "all"
                  }}
                  onClick={removeFollowMutateHandle}
                >
                  <CheckOutlined />
                </Button>
              )}
            </div>
          </div>
          <div className={"mask-button-container"}>
            {isFavorite && (
              <Button
                className={"mask-button"}
                ghost={true}
                block={true}
                onClick={removeFavoriteHandle}
              >
                <HeartFilled
                  style={{
                    fontSize: "40px"
                  }}
                />
              </Button>
            )}
            {!isFavorite && (
              <Button
                className={"mask-button"}
                ghost={true}
                block={true}
                onClick={addFavoriteHandle}
              >
                <HeartOutlined
                  style={{
                    fontSize: "40px"
                  }}
                />
              </Button>
            )}
            <div className={"number-div"}>
              {props.videoInfo.favoriteCount !== undefined
                ? props.videoInfo.favoriteCount
                : "喜欢"}
            </div>
          </div>
          <div className={"mask-button-container"}>
            <Button
              className={"mask-button"}
              ghost={true}
              onClick={() => {
                if (!props.useExternalCommentDrawer) {
                  setOpenCommentDrawer(!openCommentDrawer);
                } else {
                  props.onOpenExternalCommentDrawer?.();
                }
              }}
            >
              {openCommentDrawer && (
                <MessageFilled
                  style={{
                    fontSize: "40px"
                  }}
                />
              )}
              {!openCommentDrawer && (
                <MessageOutlined
                  style={{
                    fontSize: "40px"
                  }}
                />
              )}
            </Button>
            <div className={"number-div"}>
              {props.videoInfo.commentCount !== undefined
                ? props.videoInfo.commentCount
                : "评论"}
            </div>
          </div>
          <div className={"mask-button-container"}>
            {isCollected && (
              <Button
                className={"mask-button"}
                ghost={true}
                onClick={removeVideoFromDefaultCollectionHandle}
              >
                <StarFilled
                  style={{
                    fontSize: "40px"
                  }}
                />
              </Button>
            )}
            {!isCollected && (
              <Button
                className={"mask-button"}
                ghost={true}
                onClick={addVideo2DefaultCollectionHandle}
              >
                <StarOutlined
                  style={{
                    fontSize: "40px"
                  }}
                />
              </Button>
            )}
            <div className={"number-div"}>
              {props.videoInfo.favoriteCount !== undefined
                ? props.videoInfo.favoriteCount
                : "收藏"}
            </div>
          </div>
          <div className={"mask-button-container"}>
            <Button className={"mask-button"} ghost={true}>
              <ShareAltOutlined
                style={{
                  fontSize: "40px"
                }}
              />
            </Button>
          </div>
        </div>
      </div>
      <CorePlayerMemorized
        ref={playerRef}
        title={props.title}
        sources={props.sources}
        src={videoSource}
      />
    </div>
  );
}
