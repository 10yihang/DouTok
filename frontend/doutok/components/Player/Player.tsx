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
      const videoElement = playerRef.current as unknown as HTMLVideoElement;

      // console.log('检查播放器状态:', {
      //   hasPlayer: !!currentPlayer,
      //   hasVideoElement: !!videoElement,
      //   videoSrc: videoElement?.src,
      //   playerReady: currentPlayer?.ready,
      //   playerMedia: currentPlayer?.media,
      //   videoTagName: videoElement?.tagName
      // });

      if (currentPlayer && typeof currentPlayer.play === 'function') {
        setPlayerReady(true);
        return true;
      } else {
        setPlayerReady(false);
        return false;
      }
    };

    // 立即检查
    checkPlayerReady();

    // 定期检查播放器状态，直到就绪
    const interval = setInterval(() => {
      if (checkPlayerReady()) {
        clearInterval(interval);
      }
    }, 100);

    // 10秒后停止检查
    const timeout = setTimeout(() => {
      clearInterval(interval);
      console.log('播放器初始化超时');
    }, 10000);

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
          break;
        case ' ':
          event.preventDefault();

          // 获取当前plyr实例和原生video元素
          const currentPlayer = (playerRef.current as any)?.plyr;
          const videoElement = playerRef.current as unknown as HTMLVideoElement;

          // 方案1: 尝试使用 plyr（如果可用且准备好）
          if (currentPlayer && currentPlayer.ready && currentPlayer.media) {
            try {
              if (currentPlayer.media.paused) {
                currentPlayer.play();
              } else {
                currentPlayer.pause();
              }
              console.log("使用 Plyr 播放器控制视频");
              return;
            } catch (error) {
              // 静默失败，尝试下一个方案
            }
          }

          // 方案2: 直接使用原生 video 元素（性能最优）
          if (videoElement && videoElement.tagName === 'VIDEO') {
            try {
              if (videoElement.paused) {
                const playPromise = videoElement.play();
                if (playPromise) {
                  playPromise.catch(() => {
                    // 静默处理播放失败
                  });
                }
              } else {
                videoElement.pause();
              }
              console.log("使用原生 video 元素控制视频");
              return;
            } catch (error) {
              // 静默失败，尝试下一个方案
            }
          }

          // 方案3: 只在前两个方案都失败时才使用DOM查询（性能开销较大）
          try {
            const allVideos = document.querySelectorAll('video');
            if (allVideos.length > 0) {
              // 优先查找与当前 src 匹配的视频
              let targetVideo: HTMLVideoElement | null = null;

              if (props.src) {
                for (let i = 0; i < allVideos.length; i++) {
                  const video = allVideos[i] as HTMLVideoElement;
                  if (video.src === props.src || video.currentSrc === props.src) {
                    targetVideo = video;
                    break;
                  }
                }
              }

              // 如果没找到匹配的，使用第一个视频
              if (!targetVideo && allVideos.length > 0) {
                targetVideo = allVideos[0] as HTMLVideoElement;
              }

              if (targetVideo) {
                if (targetVideo.paused) {
                  const playPromise = targetVideo.play();
                  if (playPromise) {
                    playPromise.catch(() => {
                      // 静默处理播放失败
                    });
                  }
                } else {
                  targetVideo.pause();
                }
              }
            }
            console.log("使用 DOM 查询控制视频");
          } catch (error) {
            // 所有方案都失败，静默处理
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [props.displaying, props.onPreviousVideo, props.onNextVideo, playerReady]);
  // 处理视频切换时停止旧视频播放
  useEffect(() => {
    const currentPlayer = (playerRef.current as any)?.plyr;
    const videoElement = playerRef.current as unknown as HTMLVideoElement;

    if (props.displaying) {
      // 当视频变为显示状态时，暂停其他所有视频
      try {
        const allVideos = document.querySelectorAll('video');
        for (let i = 0; i < allVideos.length; i++) {
          const video = allVideos[i] as HTMLVideoElement;
          // 暂停其他视频（不是当前视频的）
          if (video !== videoElement && !video.paused) {
            video.pause();
          }
        }
      } catch (error) {
        // 静默处理错误
      }
    } else {
      // 当视频变为非显示状态时，立即停止播放
      // 方案1: 使用 plyr
      if (currentPlayer && typeof currentPlayer.pause === 'function') {
        try {
          if (currentPlayer.playing || !currentPlayer.paused) {
            currentPlayer.pause();
          }
          // 重置播放位置到开始
          if (typeof currentPlayer.currentTime !== 'undefined') {
            currentPlayer.currentTime = 0;
          }
        } catch (error) {
          // 静默处理错误
        }
      }

      // 方案2: 直接使用原生video元素
      if (videoElement && videoElement.tagName === 'VIDEO') {
        try {
          if (!videoElement.paused) {
            videoElement.pause();
          }
          videoElement.currentTime = 0;
        } catch (error) {
          // 静默处理错误
        }
      }
    }
  }, [props.displaying, props.src]);  // 添加一个清理函数，确保组件卸载时停止视频
  useEffect(() => {
    return () => {
      const currentPlayer = (playerRef.current as any)?.plyr;
      const videoElement = playerRef.current as unknown as HTMLVideoElement;

      // 方案1: 使用 plyr
      if (currentPlayer && typeof currentPlayer.pause === 'function') {
        try {
          if (currentPlayer.playing || !currentPlayer.paused) {
            currentPlayer.pause();
          }
          if (typeof currentPlayer.currentTime !== 'undefined') {
            currentPlayer.currentTime = 0;
          }
        } catch (error) {
          // 静默处理错误
        }
      }

      // 方案2: 使用原生video元素
      if (videoElement && videoElement.tagName === 'VIDEO') {
        try {
          if (!videoElement.paused) {
            videoElement.pause();
          }
          videoElement.currentTime = 0;
        } catch (error) {
          // 静默处理错误
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
