"use client";

import {
  SvapiGetUserInfoResponse,
  useUserServiceGetUserInfo
} from "@/api/svapi/api";
import { RequestComponent } from "@/components/RequestComponent/RequestComponent";
import Avatar from "antd/es/avatar/avatar";
import useUserStore from "@/components/UserStore/useUserStore";
import React, { useEffect } from "react";

export function UserAvatar() {
  const avatarState = useUserStore(state => state.avatar);
  const setAvatarState = useUserStore(state => state.setAvatar);

  const setCurrentUserId = useUserStore(state => state.setCurrentUserId);

  useUserServiceGetUserInfo({
    resolve: (resp: SvapiGetUserInfoResponse) => {
      if (!resp || !resp.user) {
        return resp;
      }

      // TODO: 暂时写死，未来整理成读取配置
      const newAvatar = resp.user.avatar !== undefined
        ? "http://10.255.253.63:9000/shortvideo/" + resp.user.avatar
        : "no-login.svg";
      
      setAvatarState(newAvatar);
      if (resp.user.id) {
        setCurrentUserId(resp.user.id);
        window.localStorage.setItem("currentUserId", resp.user.id);
      }
      return resp;
    }
  });

  return (
    <RequestComponent noAuth={false}>
      <Avatar src={avatarState || "no-login.svg"} />
    </RequestComponent>
  );
}
