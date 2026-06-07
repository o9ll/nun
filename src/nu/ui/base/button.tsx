import { React } from "@webpack/common";
import clsx from "clsx";
import type { KeyboardEventHandler, MouseEvent, MouseEventHandler, PropsWithChildren, RefObject } from "react";


// S.Looks = y;
// S.Colors = I;
// S.BorderColors = O;
// S.Hovers = T;
// S.Sizes = v;

export const Looks = Object.freeze({
    FILLED: "nu-button-filled",
    OUTLINED: "nu-button-outlined",
    LINK: "nu-button-link",
    BLANK: "nu-button-blank"
});

export const Colors = Object.freeze({
    BRAND: "nu-button-color-brand",
    BLURPLE: "nu-button-color-blurple",
    RED: "nu-button-color-red",
    GREEN: "nu-button-color-green",
    YELLOW: "nu-button-color-yellow",
    PRIMARY: "nu-button-color-primary",
    LINK: "nu-button-color-link",
    WHITE: "nu-button-color-white",
    TRANSPARENT: "nu-button-color-transparent",
    CUSTOM: ""
});


export const Sizes = Object.freeze({
    NONE: "",
    TINY: "nu-button-tiny",
    SMALL: "nu-button-small",
    MEDIUM: "nu-button-medium",
    LARGE: "nu-button-large",
    ICON: "nu-button-icon"
});


export type ButtonProps = PropsWithChildren<{
    className?: string;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    onKeyDown?: KeyboardEventHandler<HTMLButtonElement>;
    buttonRef?: RefObject<HTMLButtonElement | null>;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    look?: typeof Looks[keyof typeof Looks];
    color?: typeof Colors[keyof typeof Colors];
    size?: typeof Sizes[keyof typeof Sizes];
    grow?: boolean;
}>;

export default function Button({
    className,
    children,
    onClick,
    onKeyDown,
    buttonRef,
    disabled = false,
    type = "button",
    look = Looks.FILLED,
    color = Colors.BRAND,
    size = Sizes.MEDIUM,
    grow = true,
    ...others
}: ButtonProps) {
    const { useCallback } = React;
    const handleClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.(event);
    }, [onClick]);

    return <button {...others} className={
        clsx(
            "nu-button",
            className,
            look,
            color,
            size,
            grow ? "nu-button-grow" : ""
        )}
        ref={buttonRef}
        type={type === "button" ? undefined : type}
        onClick={disabled ? () => { } : handleClick}
        onKeyDown={disabled ? () => { } : onKeyDown}
        disabled={disabled}
    >
        <div className="nu-button-content">{children}</div>
    </button>;
}

Button.Looks = Looks;
Button.Colors = Colors;
Button.Sizes = Sizes;
// window.NUButton = Button;
// (() => {
//     const buttons = [];
//     for (const look in window.NUButton.Looks) {
//         if (!window.NUButton.Looks[look] || look === "BLANK") continue;
//         for (const color in window.NUButton.Colors) {
//             if (!window.NUButton.Colors[color]) continue;
//             for (const size in window.NUButton.Sizes) {
//                 if (!window.NUButton.Sizes[size]) continue;
//                 buttons.push(window.NuApi.React.createElement(window.NUButton, {
//                     look: window.NUButton.Looks[look],
//                     color: window.NUButton.Colors[color],
//                     size: window.NUButton.Sizes[size]
//                 }, "Hello World!"));
//                 buttons.push(window.NuApi.React.createElement("br"));
//             }
//         }
//     }
//     window.NuApi.showConfirmationModal("Buttons", buttons);
// })();