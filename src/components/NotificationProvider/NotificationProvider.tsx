import React, {
  createContext,
  FC,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  NotificationType,
  NotificationHelper,
  QueuedNotification,
  NotifyProviderProps,
} from "./types";
import { useLocation } from "react-router-dom";
import isEqual from "lodash/isEqual";
import { info, failure, success, queue } from "./messageBuilder";
import Notification, { DefaultTitles } from "../Notification/Notification";

const NotifyContext = createContext<NotificationHelper>({
  notification: null,
  clear: () => undefined,
  failure: () => undefined,
  success: () => undefined,
  info: () => undefined,
  queue: () => undefined,
});

export const NotificationProvider: FC<NotifyProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationType | null>(
    null
  );
  const { state, pathname } = useLocation() as QueuedNotification;

  const clear = () => notification !== null && setNotification(null);

  const setDeduplicated = (value: NotificationType) => {
    if (!isEqual(value, notification)) {
      setNotification(value);
    }
    return value;
  };

  useEffect(() => {
    if (state?.queuedNotification) {
      setDeduplicated(state.queuedNotification);
      window.history.replaceState({}, "");
    } else {
      clear();
    }
  }, [state, pathname]);

  const helper: NotificationHelper = {
    notification,
    clear,
    queue,
    failure: (title, error, message, actions) =>
      setDeduplicated(failure(title, error, message, actions)),
    info: (message, title) => setDeduplicated(info(message, title)),
    success: (message) => setDeduplicated(success(message)),
  };

  return (
    <NotifyContext.Provider value={helper}>{children}</NotifyContext.Provider>
  );
};

export function useNotify() {
  return useContext(NotifyContext);
}

export const NotificationConsumer: FC = () => {
  const notify = useNotify();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current?.hasAttribute("scrollIntoView")) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }, [notify.notification]);

  if (!notify.notification) {
    return null;
  }
  const { actions, title, type, message } = notify.notification;

  return (
    <div ref={ref}>
      <Notification
        title={title ?? DefaultTitles[type]}
        actions={actions}
        severity={type}
        onDismiss={notify.clear}
      >
        {message}
      </Notification>
    </div>
  );
};
