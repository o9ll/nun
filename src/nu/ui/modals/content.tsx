import { React } from "@webpack/common";
import clsx from "clsx";
import type { PropsWithChildren } from "react";

export default function Content({ id, className, children, scroller = true }: PropsWithChildren<{ id?: string; className?: string; scroller?: boolean; }>) {
    return <div id={id} className={clsx("nu-modal-content", { "nu-scroller-base nu-scroller-thin": scroller }, className)}>
        {children}
    </div>;
}