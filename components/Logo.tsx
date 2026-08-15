import Svg, { Path, Rect, G } from 'react-native-svg';

interface LogoProps {
  size?: number;
}

/**
 * Home screen brand mark, adapted from assets/logo.svg — cropped tight to
 * the rounded tile (the original 1024x1024 canvas has a wide transparent
 * margin around it) and with the drop-shadow filter dropped, since
 * react-native-svg doesn't support feDropShadow and the rest of the app
 * uses flat surfaces with no shadows anyway.
 */
export function Logo({ size = 40 }: LogoProps) {
  return (
    <Svg width={size} height={size} viewBox="128 128 768 768">
      <Rect x={128} y={128} width={768} height={768} rx={150} fill="#FFFFFF" />

      <Path
        d="M302 390 C302 365 322 345 347 345 H566 C591 345 611 365 611 390 L633 745 C635 777 609 802 577 802 H336 C304 802 278 777 280 745 Z"
        fill="#1B6B72"
      />

      <Path
        d="M383 390 V323 C383 266 424 225 481 225 C538 225 579 266 579 323 V390"
        fill="none"
        stroke="#1B6B72"
        strokeWidth={34}
        strokeLinecap="round"
      />

      <Path
        d="M384 345 H558 V600 L536 625 L514 600 L492 625 L470 600 L448 625 L426 600 L404 625 L384 600 Z"
        fill="#FFFFFF"
      />

      <G fill="#1B6B72">
        <Rect x={410} y={405} width={118} height={18} rx={9} />
        <Rect x={410} y={454} width={118} height={18} rx={9} />
        <Rect x={410} y={503} width={118} height={18} rx={9} />
      </G>

      <G fill="#DD5A26">
        <Rect x={532} y={631} width={72} height={171} rx={13} />
        <Rect x={626} y={568} width={72} height={234} rx={13} />
        <Rect x={720} y={505} width={72} height={297} rx={13} />
      </G>

      <Rect x={500} y={802} width={312} height={20} rx={10} fill="#1B6B72" />

      <Path
        d="M482 674 L590 570 L638 610 L754 494"
        fill="none"
        stroke="#DD5A26"
        strokeWidth={30}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M720 491 L770 477 L756 527"
        fill="none"
        stroke="#DD5A26"
        strokeWidth={30}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
