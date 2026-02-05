import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 18V6" />
      <path d="M12 10c3 0 5-2 5-4" />
      <path d="M12 10c-3 0-5-2-5-4" />
      <path d="M12 14c3 0 5 2 5 4" />
      <path d="M12 14c-3 0-5 2-5 4" />
    </svg>
  ),
  palm: (props: SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 17v-4" />
      <path d="M12 13c-1.5-2-4-2-5.5-0.5" />
      <path d="M12 13c1.5-2 4-2 5.5-0.5" />
      <path d="M12 13c-2-1.5-2-4-0.5-5.5" />
      <path d="M12 13c2-1.5 2-4 0.5-5.5" />
    </svg>
  ),
  cart: (props: SVGProps<SVGSVGElement>) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        {...props}
    >
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  ),
};
