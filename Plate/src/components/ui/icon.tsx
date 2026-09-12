import Svg, { Circle, Path, Polyline, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * One themeable icon set, drawn on a 24x24 grid with a 2px round stroke to match
 * the Figma source. Colour comes from theme tokens, never a baked-in hex.
 */
export type IconName =
  | 'arrow-left'
  | 'arrow-right'
  | 'bell'
  | 'book'
  | 'camera'
  | 'cart'
  | 'check'
  | 'check-circle'
  | 'chevron-down'
  | 'chevron-right'
  | 'clock'
  | 'close'
  | 'edit'
  | 'flame'
  | 'fridge'
  | 'heart'
  | 'home'
  | 'image'
  | 'info'
  | 'leaf'
  | 'list'
  | 'logout'
  | 'mic'
  | 'minus'
  | 'plus'
  | 'refresh'
  | 'search'
  | 'send'
  | 'settings'
  | 'sliders'
  | 'sparkle'
  | 'speaker'
  | 'stop'
  | 'trash'
  | 'undo'
  | 'user'
  | 'utensils'
  | 'warning';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Fills the shape as well as stroking it. Only meaningful for `heart`. */
  filled?: boolean;
  strokeWidth?: number;
};

export function Icon({ name, size = 22, color, filled = false, strokeWidth = 2 }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.text;
  const fill = filled ? stroke : 'none';
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderPaths(name, common, fill)}
    </Svg>
  );
}

function renderPaths(
  name: IconName,
  common: {
    stroke: string;
    strokeWidth: number;
    strokeLinecap: 'round';
    strokeLinejoin: 'round';
    fill: 'none';
  },
  fill: string
) {
  switch (name) {
    case 'arrow-left':
      return <Path {...common} d="M19 12H5m6-7-7 7 7 7" />;
    case 'arrow-right':
      return <Path {...common} d="M5 12h14m-6-7 7 7-7 7" />;
    case 'bell':
      return (
        <>
          <Path {...common} d="M18 8a6 6 0 1 0-12 0c0 6-3 7-3 7h18s-3-1-3-7" />
          <Path {...common} d="M13.7 20a2 2 0 0 1-3.4 0" />
        </>
      );
    case 'book':
      return (
        <>
          <Path {...common} d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2Z" />
          <Path {...common} d="M4 17.5h15" />
        </>
      );
    case 'camera':
      return (
        <>
          <Path
            {...common}
            d="M4 8h2.2a2 2 0 0 0 1.7-1l.7-1.3A2 2 0 0 1 10.3 4.5h3.4a2 2 0 0 1 1.7 1.2l.7 1.3a2 2 0 0 0 1.7 1H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z"
          />
          <Circle {...common} cx={12} cy={13.5} r={3.2} />
        </>
      );
    case 'cart':
      return (
        <>
          <Path {...common} d="M2 3h2l2.6 12.1a2 2 0 0 0 2 1.6h9.2a2 2 0 0 0 2-1.7L21.5 7H5" />
          <Circle {...common} cx={9} cy={20} r={1.4} />
          <Circle {...common} cx={18} cy={20} r={1.4} />
        </>
      );
    case 'check':
      return <Polyline {...common} points="20 6 9 17 4 12" />;
    case 'check-circle':
      return (
        <>
          <Circle {...common} cx={12} cy={12} r={9} />
          <Polyline {...common} points="8.5 12.3 11 14.8 15.8 9.6" />
        </>
      );
    case 'chevron-down':
      return <Polyline {...common} points="6 9 12 15 18 9" />;
    case 'chevron-right':
      return <Polyline {...common} points="9 6 15 12 9 18" />;
    case 'clock':
      return (
        <>
          <Circle {...common} cx={12} cy={12} r={9} />
          <Polyline {...common} points="12 7.5 12 12.4 15.6 14.4" />
        </>
      );
    case 'close':
      return <Path {...common} d="M6 6l12 12M18 6 6 18" />;
    case 'edit':
      return (
        <>
          <Path {...common} d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
          <Path {...common} d="M18.4 2.6a2 2 0 0 1 2.8 2.8L12.5 14l-3.8.9.9-3.8Z" />
        </>
      );
    case 'flame':
      return (
        <>
          <Path
            {...common}
            d="M12 22c3.9 0 6.5-2.4 6.5-6 0-4.6-4.3-6.6-4.3-10.4C14.2 3.5 12.8 2 12 2c0 3.4-2.6 4.6-2.6 7.6 0 1.6.8 2.6.8 2.6S8.3 11 8.3 8.6C6.6 10.2 5.5 12.6 5.5 16c0 3.6 2.6 6 6.5 6Z"
          />
        </>
      );
    case 'fridge':
      return (
        <>
          <Rect {...common} x={5} y={2.5} width={14} height={19} rx={2.6} />
          <Path {...common} d="M5 10h14M8.5 6v1.6M8.5 13v2.4" />
        </>
      );
    case 'heart':
      return (
        <Path
          stroke={common.stroke}
          strokeWidth={common.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={fill}
          d="M20.4 5.6a5.2 5.2 0 0 0-7.4 0L12 6.6l-1-1a5.2 5.2 0 0 0-7.4 7.4l7.7 7.7a1 1 0 0 0 1.4 0l7.7-7.7a5.2 5.2 0 0 0 0-7.4Z"
        />
      );
    case 'home':
      return (
        <>
          <Path {...common} d="M3 10.2 12 3l9 7.2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
          <Path {...common} d="M9.2 21v-7.4h5.6V21" />
        </>
      );
    case 'image':
      return (
        <>
          <Rect {...common} x={3} y={3.5} width={18} height={17} rx={2.6} />
          <Circle {...common} cx={8.7} cy={9.4} r={1.6} />
          <Path {...common} d="m3.6 17.4 4.6-4.3 4 3.6 3-2.6 5.2 4.6" />
        </>
      );
    case 'info':
      return (
        <>
          <Circle {...common} cx={12} cy={12} r={9} />
          <Path {...common} d="M12 11v5.4M12 7.6h.01" />
        </>
      );
    case 'leaf':
      return (
        <>
          <Path {...common} d="M4 20c0-8 5.4-13 16-13 0 9.4-5.2 14-11 14a5 5 0 0 1-5-1Z" />
          <Path {...common} d="M4.5 19.5C8 16 12 13.4 17 11.6" />
        </>
      );
    case 'list':
      return <Path {...common} d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />;
    case 'logout':
      return (
        <>
          <Path {...common} d="M9.5 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.5" />
          <Path {...common} d="M16 8l4 4-4 4M20 12H9.5" />
        </>
      );
    case 'mic':
      return (
        <>
          <Rect {...common} x={9} y={2.5} width={6} height={11.5} rx={3} />
          <Path {...common} d="M5 11.5a7 7 0 0 0 14 0M12 18.6V21.5" />
        </>
      );
    case 'minus':
      return <Path {...common} d="M5 12h14" />;
    case 'plus':
      return <Path {...common} d="M12 5v14M5 12h14" />;
    case 'refresh':
      return (
        <>
          <Path {...common} d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
          <Polyline {...common} points="20.5 3.6 20.5 8.4 15.7 8.4" />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...common} cx={11} cy={11} r={7} />
          <Path {...common} d="m16.2 16.2 4.3 4.3" />
        </>
      );
    case 'send':
      return <Path {...common} d="M4.5 12h13M11 5.5 17.5 12 11 18.5" />;
    case 'settings':
      return (
        <>
          <Circle {...common} cx={12} cy={12} r={3.2} />
          <Path
            {...common}
            d="M19.4 14.2a1.6 1.6 0 0 0 .3 1.8l.1.1a1.8 1.8 0 0 1-2.6 2.6l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.3a1.8 1.8 0 0 1-3.6 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a1.8 1.8 0 0 1-2.6-2.6l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.8a1.8 1.8 0 0 1 0-3.6H4a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a1.8 1.8 0 0 1 2.6-2.6l.1.1a1.6 1.6 0 0 0 1.8.3H9.8a1.6 1.6 0 0 0 1-1.5V3.8a1.8 1.8 0 0 1 3.6 0V4a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a1.8 1.8 0 0 1 2.6 2.6l-.1.1a1.6 1.6 0 0 0-.3 1.8v.1a1.6 1.6 0 0 0 1.5 1h.3a1.8 1.8 0 0 1 0 3.6H21a1.6 1.6 0 0 0-1.5 1Z"
          />
        </>
      );
    case 'sliders':
      return (
        <Path
          {...common}
          d="M10 8h4M12 21v-9M12 8V3M17 16h4M19 12V3M19 21v-5M3 14h4M5 10V3M5 21v-7"
        />
      );
    case 'sparkle':
      return <Path {...common} d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9Z" />;
    case 'speaker':
      return (
        <>
          <Path {...common} d="M11 5.5 6.8 9H3.5v6h3.3L11 18.5Z" />
          <Path {...common} d="M15.5 9.2a4 4 0 0 1 0 5.6M18.4 6.6a8 8 0 0 1 0 10.8" />
        </>
      );
    case 'stop':
      return <Rect {...common} x={6} y={6} width={12} height={12} rx={2.4} />;
    case 'trash':
      return (
        <>
          <Path {...common} d="M4 7h16M9.5 7V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4A1.3 1.3 0 0 1 14.5 4.8V7" />
          <Path {...common} d="M6.5 7l.8 12.2A2 2 0 0 0 9.3 21h5.4a2 2 0 0 0 2-1.8L17.5 7" />
          <Path {...common} d="M10.4 11v6M13.6 11v6" />
        </>
      );
    case 'undo':
      return (
        <>
          <Polyline {...common} points="9 7 4 7 4 2.5" />
          <Path {...common} d="M4.4 11.5a8 8 0 1 1 2 5.3" />
        </>
      );
    case 'user':
      return (
        <>
          <Circle {...common} cx={12} cy={7.6} r={4} />
          <Path {...common} d="M4.5 21v-2a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v2" />
        </>
      );
    case 'utensils':
      return (
        <>
          <Path {...common} d="M6 3v7a2.5 2.5 0 0 0 5 0V3M8.5 12.5V21" />
          <Path {...common} d="M16.5 3c2 1.6 2.6 3.8 2.6 6.2 0 1.6-.9 2.8-2.6 3.3V21" />
        </>
      );
    case 'warning':
      return (
        <>
          <Path
            {...common}
            d="M10.3 4.2 2.9 17a2 2 0 0 0 1.7 3h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z"
          />
          <Path {...common} d="M12 9.5v4M12 16.6h.01" />
        </>
      );
    default:
      return null;
  }
}
