import { React } from "@webpack/common";
import clsx from "clsx";
import type { CSSProperties, MouseEventHandler, PropsWithChildren } from "react";

export const Direction = Object.freeze({
    VERTICAL: "flex-vertical",
    HORIZONTAL: "flex-horizontal",
    HORIZONTAL_REVERSE: "flex-reverse"
});

export const Justify = Object.freeze({
    START: "flex-justify-start",
    END: "flex-justify-end",
    CENTER: "flex-justify-center",
    BETWEEN: "flex-justify-between",
    AROUND: "flex-justify-around"
});

export const Align = Object.freeze({
    START: "flex-align-start",
    END: "flex-align-end",
    CENTER: "flex-align-center",
    STRETCH: "flex-align-stretch",
    BASELINE: "flex-align-baseline"
});

export const Wrap = Object.freeze({
    NO_WRAP: "flex-no-wrap",
    WRAP: "flex-wrap",
    WRAP_REVERSE: "flex-wrap-reverse"
});


export function Child(props: { className?: string;[x: string]: any; }) {
    if (!props.className) props.className = "";
    props.className = clsx(props.className, "flex-child");
    return <Flex {...props} />;
}

type FlexProps = PropsWithChildren<{
    id?: string;
    className?: string;
    style?: CSSProperties;
    shrink?: number;
    grow?: number;
    basis?: "auto",
    justify?: typeof Justify[keyof typeof Justify];
    direction?: typeof Direction[keyof typeof Direction];
    align?: typeof Align[keyof typeof Align];
    wrap?: typeof Wrap[keyof typeof Wrap];
    onClick?: MouseEventHandler<HTMLDivElement>;
}>;

export default function Flex({
    children,
    className,
    style,
    shrink = 1,
    grow = 1,
    basis = "auto",
    direction = Direction.HORIZONTAL,
    align = Align.STRETCH,
    justify = Justify.START,
    wrap = Wrap.NO_WRAP,
    ...props
}: FlexProps) {
    return <div
        {...props}
        className={clsx(
            "flex",
            direction,
            justify,
            align,
            wrap,
            className
        )}
        style={Object.assign({
            flexShrink: shrink,
            flexGrow: grow,
            flexBasis: basis
        }, style)}
    >
        {children}
    </div>;
}

Flex.Child = Child;
Flex.Direction = Direction;
Flex.Align = Align;
Flex.Justify = Justify;
Flex.Wrap = Wrap;