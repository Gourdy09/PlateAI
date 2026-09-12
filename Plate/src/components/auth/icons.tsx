import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

/** Exact path data from Figma-exported SVGs in assets/images/auth. */

export function LogoMark({ size = 22, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <G clipPath="url(#logoClip)">
        <Path
          d="M13.7502 8.24978L8.24978 13.7502M8.24978 8.24978L13.7502 13.7502M20.1674 11C20.1674 16.063 16.063 20.1674 11 20.1674C5.93698 20.1674 1.8326 16.063 1.8326 11C1.8326 5.93698 5.93698 1.8326 11 1.8326C16.063 1.8326 20.1674 5.93698 20.1674 11Z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </G>
      <Defs>
        <ClipPath id="logoClip">
          <Rect width={22} height={22} fill="white" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}

export function UtensilsCrossed({ size = 15, color = '#e85d3f' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M10.0006 1.2495L8.56313 2.68713C8.21958 3.03765 8.02716 3.50892 8.02716 3.99975C8.02716 4.49058 8.21958 4.96184 8.56313 5.31236L9.6881 6.43747C10.0386 6.78105 10.5098 6.9735 11.0006 6.9735C11.4913 6.9735 11.9626 6.78105 12.313 6.43747L13.7505 4.99984M9.37519 9.37511L2.06286 2.06195C1.81342 2.30638 1.61525 2.59813 1.47997 2.92012C1.34468 3.24211 1.275 3.58786 1.275 3.93712C1.275 4.28638 1.34468 4.63213 1.47997 4.95412C1.61525 5.2761 1.81342 5.56786 2.06286 5.81229L6.62525 10.3752C7.06274 10.8127 7.87522 10.8127 8.37521 10.3752L9.37519 9.37511ZM9.37519 9.37511L13.7501 13.7505M1.31284 13.6256L5.31274 9.68776M11.8753 3.12467L7.50044 7.50006"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MailIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M16.5006 5.25038L9.75681 9.5452C9.52796 9.67809 9.26802 9.74809 9.00338 9.74809C8.73873 9.74809 8.47879 9.67809 8.24994 9.5452L1.4994 5.25038M2.99952 3.0006H15.0005C15.829 3.0006 16.5006 3.67211 16.5006 4.50045V13.4996C16.5006 14.3279 15.829 14.9994 15.0005 14.9994H2.99952C2.17103 14.9994 1.4994 14.3279 1.4994 13.4996V4.50045C1.4994 3.67211 2.17103 3.0006 2.99952 3.0006Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function LockIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M5.25 8.25V5.25C5.25 3.17893 6.92893 1.5 9 1.5C11.0711 1.5 12.75 3.17893 12.75 5.25V8.25M5.625 16.5H12.375C13.4105 16.5 14.25 15.6605 14.25 14.625V10.125C14.25 9.08947 13.4105 8.25 12.375 8.25H5.625C4.58947 8.25 3.75 9.08947 3.75 10.125V14.625C3.75 15.6605 4.58947 16.5 5.625 16.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeOffIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M7.4325 7.4325C7.1492 7.71585 6.98999 8.10015 6.98999 8.50001C6.98999 8.89986 7.1492 9.28416 7.4325 9.56751C7.71585 9.85081 8.10015 10.01 8.50001 10.01C8.89986 10.01 9.28416 9.85081 9.56751 9.56751M13.2675 13.2675C12.0901 14.1649 10.6825 14.6552 9.22501 14.6625C5.62501 14.6625 2.62501 12.375 1.12501 9C1.85266 7.62769 2.90169 6.44701 4.19251 5.5575M7.34251 3.4875C7.95559 3.33834 8.58675 3.26327 9.22051 3.2625C12.8205 3.2625 15.8205 5.55 17.3205 8.925C16.6602 10.1761 15.735 11.2828 14.6055 12.18M1.12501 1.125L16.875 16.875"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EyeIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M1.125 9C2.625 5.625 5.625 3.3375 9.225 3.3375C12.825 3.3375 15.825 5.625 17.325 9C15.825 12.375 12.825 14.6625 9.225 14.6625C5.625 14.6625 2.625 12.375 1.125 9Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={9} cy={9} r={2.25} stroke={color} strokeWidth={1.5} />
    </Svg>
  );
}

export function ArrowRightCircle({ size = 18, color = '#ffffff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5Z"
        stroke={color}
        strokeWidth={1.5}
      />
      <Path
        d="M8.25 6L11.25 9L8.25 12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ArrowLeftCircle({ size = 16, color = '#e85d3f' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z"
        stroke={color}
        strokeWidth={1.3}
      />
      <Path
        d="M8.66667 5.33333L6 8L8.66667 10.6667"
        stroke={color}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M14.25 15.75V14.25C14.25 13.4544 13.9339 12.6913 13.3713 12.1287C12.8087 11.5661 12.0456 11.25 11.25 11.25H6.75C5.95435 11.25 5.19129 11.5661 4.62868 12.1287C4.06607 12.6913 3.75 13.4544 3.75 14.25V15.75M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserCheckIcon({ size = 18, color = '#776F66' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M11.25 14.25L12.75 15.75L16.5 12M12 5.25C12 6.90685 10.6569 8.25 9 8.25C7.34315 8.25 6 6.90685 6 5.25C6 3.59315 7.34315 2.25 9 2.25C10.6569 2.25 12 3.59315 12 5.25ZM3.75 15.75V14.25C3.75 13.4544 4.06607 12.6913 4.62868 12.1287C5.19129 11.5661 5.95435 11.25 6.75 11.25H10.125"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckCircleIcon({ size = 15, color = '#3F8F5B' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Path
        d="M5.625 7.5L7.03125 8.90625L9.84375 6.09375M13.125 7.5C13.125 10.6066 10.6066 13.125 7.5 13.125C4.3934 13.125 1.875 10.6066 1.875 7.5C1.875 4.3934 4.3934 1.875 7.5 1.875C10.6066 1.875 13.125 4.3934 13.125 7.5Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function AppleIcon({ size = 18, color = '#25221e' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M12.48 9.54c.02-1.52.87-2.62 2.1-3.31-.79-1.13-2-1.74-3.45-1.83-1.45-.09-2.86.85-3.4.85-.57 0-1.85-.83-3.04-.81-1.56.02-3 .91-3.8 2.3-1.62 2.81-.41 6.98 1.16 9.27.77 1.12 1.69 2.37 2.9 2.33 1.16-.05 1.6-.75 3-.75s1.8.75 3.03.73c1.25-.02 2.05-1.14 2.81-2.27.55-.81.78-1.24 1.22-2.17-2.86-1.08-3.31-5.11-.53-6.34zM10.84 2.93c.63-.76 1.05-1.82.93-2.88-1.02.04-2.24.68-2.96 1.46-.65.7-1.19 1.81-1.04 2.85 1.1.08 2.26-.55 3.07-1.43z"
        fill={color}
      />
    </Svg>
  );
}

export function GoogleIcon({ size = 18 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <Path
        d="M16.5 9.20455C16.5 8.56636 16.4427 7.95273 16.3355 7.36364H9V10.845H13.3436C13.1566 11.8527 12.5886 12.7064 11.7368 13.2782V15.3395H14.2205C15.6727 14.0027 16.5 12.0364 16.5 9.20455Z"
        fill="#4285F4"
      />
      <Path
        d="M9 17C10.93 17 12.5482 16.3609 13.7368 15.3395L11.2532 13.2782C10.5655 13.7382 9.68591 14.0109 9 14.0109C7.13773 14.0109 5.56045 12.7545 4.99818 11.0645H2.43182V13.1927C3.61364 15.5409 6.11364 17 9 17Z"
        fill="#34A853"
      />
      <Path
        d="M4.99818 11.0645C4.83818 10.6045 4.74727 10.1136 4.74727 9.60909C4.74727 9.10455 4.83818 8.61364 4.99818 8.15364V6.02545H2.43182C1.91364 7.05818 1.61364 8.20545 1.61364 9.60909C1.61364 11.0127 1.91364 12.16 2.43182 13.1927L4.99818 11.0645Z"
        fill="#FBBC05"
      />
      <Path
        d="M9 5.20727C9.78091 5.20727 10.4818 5.47545 11.0332 6.00364L13.7855 3.25136C12.545 2.09636 10.9268 1.38636 9 1.38636C6.11364 1.38636 3.61364 2.84545 2.43182 5.19364L4.99818 7.32182C5.56045 5.63182 7.13773 5.20727 9 5.20727Z"
        fill="#EA4335"
      />
    </Svg>
  );
}
