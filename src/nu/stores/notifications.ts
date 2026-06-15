/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Store from "./base";
import type {Notification} from "../ui/notifications";

export default new class Notifications extends Store {
    private notificationsArray: Notification[] = [];

    setNotifications(notifications: Notification[]) {
        this.notificationsArray = notifications;
        this.emitChange();
    }

    removeNotification(id: string) {
        this.notificationsArray = this.notificationsArray.filter((n: Notification) => n.id !== id);
        this.emitChange();
    }

    addNotification(notification: Notification) {
        this.notificationsArray.push(notification);
        this.emitChange();
    }

    get notifications(): Notification[] {
        return this.notificationsArray;
    }
};