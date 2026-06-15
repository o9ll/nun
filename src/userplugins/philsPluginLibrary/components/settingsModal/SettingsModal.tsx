/*
 * Nun, a Discord client mod
 * Copyright (c) 2026 o9
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Flex } from "@components/Flex";
import { ContributorAuthorSummary } from "../../../philsPluginLibrary/components/ContributorAuthorSummary";
import { Author, Contributor } from "../../../philsPluginLibrary/types";
import { ModalSize, RenderModalProps } from "@vencord/discord-types";
import { Modal } from "@webpack/common";
import { JSX, ReactNode } from "react";

const legacyModalSizeMap: Record<string, ModalSize> = {
    small: "sm",
    medium: "md",
    large: "lg",
    dynamic: "dynamic",
};

export interface SettingsModalProps extends RenderModalProps {
    title?: string;
    onDone?: () => void;
    footerContent?: JSX.Element;
    closeButtonName?: string;
    author?: Author;
    contributors?: Contributor[];
    size?: ModalSize | "small" | "medium" | "large" | "dynamic";
    children?: ReactNode;
}

export const SettingsModal = (props: SettingsModalProps) => {
    const {
        title,
        onClose,
        onDone,
        footerContent,
        closeButtonName,
        author,
        contributors,
        size,
        children,
        transitionState,
    } = props;

    const modalSize = size ? legacyModalSizeMap[size] ?? size as ModalSize : undefined;

    const footerLeft = (author || (contributors?.length) || footerContent) ? (
        <Flex style={{ width: "100%", justifyContent: "flex-start", alignItems: "center", gap: "1em" }}>
            {(author || contributors?.length) &&
                <ContributorAuthorSummary author={author} contributors={contributors} />
            }
            {footerContent}
        </Flex>
    ) : undefined;

    return (
        <Modal
            transitionState={transitionState}
            onClose={onClose}
            size={modalSize}
            title={title}
            actionBarInput={footerLeft}
            actions={[{
                text: closeButtonName ?? "Done",
                variant: "primary",
                onClick: () => onDone?.(),
            }]}
        >
            <div style={{ marginBottom: "1em", display: "flex", flexDirection: "column", gap: "1em" }}>
                {children}
            </div>
        </Modal>
    );
};
