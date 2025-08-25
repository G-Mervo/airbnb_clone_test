import React from "react";

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string };

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MessageSquareMore(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <path d="M8 10h8" />
      <path d="M8 14h6" />
    </svg>
  );
}

export default { MessageSquareMore };





