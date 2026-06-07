import { React } from "@webpack/common";
import Button, { type ButtonProps, Colors, Looks } from "./base/button";
import Notifications from "../stores/notifications";
import Text from "./base/text";
import { LucideIcon } from "./icons";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide";
import DOMManager from "../core/dommanager";
import DiscordModules from "../webpack/modules";
import type { MouseEvent, ReactNode } from "react";
import { useStateFromStores } from "./hooks";
import Markdown from "./base/markdown";
import ErrorBoundary from "./errorboundary";

// TODO: let arven fix this
export type NotificationType = "warning" | "error" | "info" | "success";

interface ButtonActions extends ButtonProps {
    label: string;
    dontClose?: boolean;
    dontCloseOnActionIfHoldingShiftKey?: boolean;
}

export interface Notification {
    id: string;
    title?: string;
    content?: string | ReactNode;
    type?: NotificationType;
    duration?: number;
    actions?: ButtonActions[];

    onClose?(): void;

    onClick?(): void;

    icon?: React.ComponentType<any>;
}

const Icon = ({ type }: { type: NotificationType; }) => {
    switch (type) {
        case "warning":
            return <LucideIcon icon={TriangleAlert} color="var(--status-warning)" size="18px" />;
        case "error":
            return <LucideIcon icon={CircleAlert} color="var(--status-danger)" size="18px" />;
        case "info":
            return <LucideIcon icon={Info} color="#3B82F6" size="18px" />;
        case "success":
            return <LucideIcon icon={CircleCheck} color="var(--status-positive)" size="18px" />;
        default:
            return null;
    }
};

class NotificationUI {
    static container: HTMLDivElement | null = null;

    initialize() {
        const containerId = "notifications-container";
        let container = document.getElementById(containerId) as HTMLDivElement;
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            DOMManager.nuBody.appendChild(container);
        }
        NotificationUI.container = container;

        DiscordModules.ReactDOM.createRoot(container).render(<PersistentNotificationContainer />);
    }

    show(notif: Notification) {
        // If there are many notifications of one ID. This will cause eccentric issues like notifications not closing.
        // Or duplicate notifications.

        let notificationData = Notifications.notifications.find(notification => notification.id === notif.id);

        if (!notificationData) {
            const kSelf = Symbol("kSelf");

            notificationData = {
                ...notif,
                // @ts-expect-error nu
                [kSelf]: true
            };

            this.upsertNotification(notificationData!);
        }

        const kSelf = Reflect.ownKeys(notificationData!).at(-1);

        return {
            id: notificationData!.id,
            isVisible: () => {
                const currentNotifications = Notifications.notifications;
                // @ts-expect-error nu
                return currentNotifications.findIndex(notification => notification[kSelf]) !== -1;
            },
            close: () => {
                const currentNotifications = Notifications.notifications;
                // @ts-expect-error nu
                const notificationIndex = currentNotifications.findIndex(notification => notification[kSelf]);

                if (notificationIndex !== -1) {
                    this.hide(notificationData!.id);
                }
            }
        };
    }

    upsertNotification(notificationData: Notification) {
        Notifications.addNotification(notificationData);
    }

    hide(id: string) {
        const currentNotifications = Notifications.notifications;
        const notificationIndex = currentNotifications.findIndex((n: Notification) => n.id === id);

        if (notificationIndex !== -1) {
            Notifications.removeNotification(currentNotifications[notificationIndex].id);
        }
    }
}

const PersistentNotificationContainer = () => {
    const notifications = useStateFromStores<Notification[]>(Notifications, () => Notifications.notifications.concat(), [], true);
    // const position: string = useStateFromStores(Settings, () => Settings.get("settings", "general", "notificationPosition"));
    const position = "top-right";

    return (
        <div
            id="notifications-root"
            className={`notification-${position}`}
        >
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    notification={notification}
                />
            ))}
        </div>
    );
};

const NotificationUIInstance = new NotificationUI();

const NotificationItem = ({ notification }: { notification: Notification; }) => {
    const {
        id,
        title = "",
        content = "",
        type = "info",
        duration = 5000,
        actions = [],
    } = notification;

    const [isPaused, setIsPaused] = React.useState(false);

    const spring = DiscordModules.ReactSpring;
    const progressProps = spring.useSpring({
        width: "0%",
        from: { width: "100%" },
        config: { duration },
        pause: isPaused,
        onChange: ({ width }: { width: string; }) => {
            if (width === "0%") {
                handleClose();
            }
        },
    });

    const handleClose = () => {
        NotificationUIInstance.hide(id);
        notification.onClose?.();
    };

    return (
        <spring.animated.div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className={`notification notification-${type}`}
        >
            <div className={"notification-content"}>
                <div className="notification-header">
                    <div className="notification-icon">
                        <div className="notification-icon">
                            {notification.icon ? (
                                <ErrorBoundary>
                                    <notification.icon />
                                </ErrorBoundary>
                            ) : (
                                <Icon type={type} />
                            )}
                        </div>
                    </div>
                    {title && <div className="notification-title">{title}</div>}
                </div>
                {content && (
                    <div className="notification-body">
                        <div className="notification-content-text">
                            {content && (
                                <div className="notification-body">
                                    <div className="notification-content-text">
                                        {typeof content === "string" ? (
                                            <Markdown>{content}</Markdown>
                                        ) : (
                                            <ErrorBoundary>{content}</ErrorBoundary>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            {actions.length > 0 && (
                <div className="notification-footer">
                    {actions.map((action, index) => {
                        // @ts-expect-error nu
                        const color = Colors[action?.color?.toUpperCase()] ? `button-color-${action?.color}` : Button.Colors.PRIMARY;
                        // @ts-expect-error nu
                        const look = Looks[action?.look?.toUpperCase()] ? `button-${action?.look}` : Button.Looks.FILLED;

                        return <Button
                            {...action}
                            key={index}
                            // @ts-expect-error nu
                            color={color}
                            // @ts-expect-error nu
                            look={look}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.onClick?.(e);
                                if (!action.dontClose && !(action.dontCloseOnActionIfHoldingShiftKey && e.shiftKey)) {
                                    handleClose();
                                }
                            }}
                            className="notification-action"
                        >
                            {action?.label}
                        </Button>;
                    })}
                </div>
            )}
            <Text
                onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    handleClose();
                }}
                className="notification-close"
            >
                ✕
            </Text>
            <spring.animated.div
                className="notification-progress"
                style={{
                    ...progressProps,
                    backgroundColor: {
                        success: "var(--status-positive)",
                        error: "var(--status-danger)",
                        warning: "var(--status-warning)",
                        info: "var(--nu-brand)"
                    }[type]
                }}
            />
        </spring.animated.div>
    );
};

export default NotificationUIInstance;
